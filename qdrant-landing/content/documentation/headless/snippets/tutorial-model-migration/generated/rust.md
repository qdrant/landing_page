```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateVectorNameRequestBuilder, DeleteVectorNameRequestBuilder,
    DenseVectorCreationConfigBuilder, Distance, Document, NamedVectors, PointStruct, PointVectors,
    Query, QueryPointsBuilder, ScrollPointsBuilder, UpdateMode, UpdatePointVectorsBuilder,
    UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new(new_collection)
            .vectors_config(VectorParamsBuilder::new(512, Distance::Cosine)), // Size of the new embedding vectors
    )
    .await?;

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

let results = client
    .query(
        QueryPointsBuilder::new(old_collection)
            .query(Query::new_nearest(Document::new("my query", old_model)))
            .limit(10),
    )
    .await?;

let results = client
    .query(
        QueryPointsBuilder::new(new_collection)
            .query(Query::new_nearest(Document::new("my query", new_model)))
            .limit(10),
    )
    .await?;

client
    .create_vector_name(
        CreateVectorNameRequestBuilder::new(
            collection,
            new_vector,
            DenseVectorCreationConfigBuilder::new(512, Distance::Cosine), // Size of the new embedding vectors
        ),
    )
    .await?;

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

let old_vector_results = client
    .query(
        QueryPointsBuilder::new(collection)
            .query(Query::new_nearest(Document::new("my query", old_model)))
            .using(old_vector)
            .limit(10),
    )
    .await?;

let new_vector_results = client
    .query(
        QueryPointsBuilder::new(collection)
            .query(Query::new_nearest(Document::new("my query", new_model)))
            .using(new_vector)
            .limit(10),
    )
    .await?;

client
    .delete_vector_name(DeleteVectorNameRequestBuilder::new(
        collection,
        old_vector,
    ))
    .await?;
```
