use std::collections::HashMap;

use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateVectorNameRequestBuilder, DeleteVectorNameRequestBuilder,
    DenseVectorCreationConfigBuilder, Distance, Document, NamedVectors, PointStruct, PointVectors,
    Query, QueryPointsBuilder, ScrollPointsBuilder, UpdateMode, UpdatePointVectorsBuilder,
    UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let QDRANT_URL = "";
    let QDRANT_API_KEY = "";

    let client = Qdrant::from_url(QDRANT_URL)
        .api_key(QDRANT_API_KEY)
        .build()?;

    let new_collection = "new_collection";
    let old_collection = "old_collection";

    let old_model = "sentence-transformers/all-minilm-l6-v2";
    let new_model = "qdrant/clip-vit-b-32-text";

    let collection = "my_collection";
    let old_vector = "old-model";
    let new_vector = "new-model";
    // @hide-end

    // @block-start create-new-collection
    client
        .create_collection(
            CreateCollectionBuilder::new(new_collection)
                .vectors_config(VectorParamsBuilder::new(512, Distance::Cosine)), // Size of the new embedding vectors
        )
        .await?;
    // @block-end create-new-collection

    // @block-start upsert-old-collection
    client
        .upsert_points(UpsertPointsBuilder::new(
            old_collection,
            vec![PointStruct::new(
                1,
                Document::new("Example document", old_model),
                [("text", "Example document".into())],
            )],
        ))
        .await?;
    // @block-end upsert-old-collection

    // @block-start upsert-new-collection
    client
        .upsert_points(UpsertPointsBuilder::new(
            new_collection,
            vec![PointStruct::new(
                1,
                // Use the new embedding model to encode the document
                Document::new("Example document", new_model),
                [("text", "Example document".into())],
            )],
        ))
        .await?;
    // @block-end upsert-new-collection

    // @block-start migrate-points
    let mut last_offset = None;
    let batch_size = 100; // Number of points to read in each batch

    loop {
        // Get the next batch of points from the old collection
        let mut scroll_builder = ScrollPointsBuilder::new(old_collection)
            .limit(batch_size)
            // Include payloads in the response, as we need them to re-embed the vectors
            .with_payload(true)
            // We don't need the old vectors, so let's save on the bandwidth
            .with_vectors(false);

        if let Some(offset) = last_offset {
            scroll_builder = scroll_builder.offset(offset);
        }

        let scroll_result = client.scroll(scroll_builder).await?;

        let records = scroll_result.result;
        last_offset = scroll_result.next_page_offset;

        // Re-embed the points using the new model
        let points: Vec<PointStruct> = records
            .iter()
            .map(|record| {
                PointStruct::new(
                    // Keep the original ID to ensure consistency
                    record.id.clone().unwrap(),
                    // Use the new embedding model to encode the text from the payload,
                    // assuming that was the original source of the embedding
                    Document::new(
                        record.payload.get("text")
                            .and_then(|v| v.as_str())
                            .map_or("", |v| v),
                        new_model,
                    ),
                    // Keep the original payload
                    record.payload.clone(),
                )
            })
            .collect();

        // Upsert the re-embedded points into the new collection
        client
            .upsert_points(
                // Only insert the point if a point with this ID does not already exist.
                UpsertPointsBuilder::new(new_collection, points)
                    .update_mode(UpdateMode::InsertOnly),
            )
            .await?;

        // Check if we reached the end of the collection
        if last_offset.is_none() {
            break;
        }
    }
    // @block-end migrate-points

    // @block-start search-old-collection
    let results = client
        .query(
            QueryPointsBuilder::new(old_collection)
                .query(Query::new_nearest(Document::new("my query", old_model)))
                .limit(10),
        )
        .await?;
    // @block-end search-old-collection

    // @hide-start
    _ = results;
    // @hide-end

    // @block-start search-new-collection
    let results = client
        .query(
            QueryPointsBuilder::new(new_collection)
                .query(Query::new_nearest(Document::new("my query", new_model)))
                .limit(10),
        )
        .await?;
    // @block-end search-new-collection

    // @hide-start
    _ = results;
    // @hide-end

    // @block-start add-named-vector
    client
        .create_vector_name(
            CreateVectorNameRequestBuilder::new(
                collection,
                new_vector,
                DenseVectorCreationConfigBuilder::new(512, Distance::Cosine), // Size of the new embedding vectors
            ),
        )
        .await?;
    // @block-end add-named-vector

    // @block-start upsert-both-vectors
    client
        .upsert_points(UpsertPointsBuilder::new(
            collection,
            vec![PointStruct::new(
                1,
                NamedVectors::default()
                    .add_vector(
                        old_vector,
                        Document {
                            text: "Example document".into(),
                            model: old_model.into(),
                            ..Default::default()
                        },
                    )
                    .add_vector(
                        new_vector,
                        Document {
                            text: "Example document".into(),
                            model: new_model.into(),
                            ..Default::default()
                        },
                    ),
                [("text", "Example document".into())],
            )],
        ))
        .await?;
    // @block-end upsert-both-vectors

    // @block-start re-embed-existing
    let mut last_offset = None;
    let batch_size = 100;

    loop {
        let mut scroll_builder = ScrollPointsBuilder::new(collection)
            .limit(batch_size)
            .with_payload(true)
            .with_vectors(false);

        if let Some(offset) = last_offset {
            scroll_builder = scroll_builder.offset(offset);
        }

        let scroll_result = client.scroll(scroll_builder).await?;
        let records = scroll_result.result;
        last_offset = scroll_result.next_page_offset;

        // Update only the new vector on each point; the old vector and payload are untouched
        let point_vectors: Vec<PointVectors> = records
            .iter()
            .map(|record| PointVectors {
                id: record.id.clone(),
                vectors: Some(
                    HashMap::<String, Document>::from([(
                        new_vector.to_string(),
                        Document::new(
                            record.payload.get("text")
                                .and_then(|v| v.as_str())
                                .map_or("", |v| v),
                            new_model,
                        ),
                    )])
                    .into(),
                ),
            })
            .collect();

        client
            .update_vectors(UpdatePointVectorsBuilder::new(collection, point_vectors))
            .await?;

        if last_offset.is_none() {
            break;
        }
    }
    // @block-end re-embed-existing

    // @block-start search-with-old-vector
    let old_vector_results = client
        .query(
            QueryPointsBuilder::new(collection)
                .query(Query::new_nearest(Document::new("my query", old_model)))
                .using(old_vector)
                .limit(10),
        )
        .await?;
    // @block-end search-with-old-vector

    // @hide-start
    _ = old_vector_results;
    // @hide-end

    // @block-start search-with-new-vector
    let new_vector_results = client
        .query(
            QueryPointsBuilder::new(collection)
                .query(Query::new_nearest(Document::new("my query", new_model)))
                .using(new_vector)
                .limit(10),
        )
        .await?;
    // @block-end search-with-new-vector

    // @hide-start
    _ = new_vector_results;
    // @hide-end

    // @block-start delete-old-named-vector
    client
        .delete_vector_name(DeleteVectorNameRequestBuilder::new(
            collection,
            old_vector,
        ))
        .await?;
    // @block-end delete-old-named-vector

    Ok(())
}
