use std::collections::HashMap;

use base64::prelude::*;
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, DocumentBuilder, ImageBuilder, NamedVectors, PointStruct,
    Query, QueryPointsBuilder, UpsertPointsBuilder, Value, VectorParamsBuilder,
    VectorsConfigBuilder,
};

pub async fn main() -> anyhow::Result<()> {
    // @block-start client-connection
    let client = Qdrant::from_url(&std::env::var("QDRANT_URL")?)
        .api_key(std::env::var("QDRANT_API_KEY")?)
        .build()?;
    // @block-end client-connection

    // @block-start define-dataset
    fn image_to_base64_url(image_path: &str) -> anyhow::Result<String> {
        let prefix = "data:image/png;base64";
        let bytes = std::fs::read(image_path)?;
        Ok(format!("{prefix},{}", BASE64_STANDARD.encode(bytes)))
    }

    struct Doc {
        caption: &'static str,
        image: &'static str,
    }

    let documents = vec![
        Doc { caption: "An image about plane emergency safety.", image: "images/image-1.png" },
        Doc { caption: "An image about airplane components.", image: "images/image-2.png" },
        Doc { caption: "An image about COVID safety restrictions.", image: "images/image-3.png" },
        Doc { caption: "A confidential image about UFO sightings.", image: "images/image-4.png" },
        Doc { caption: "An image about unusual footprints on Aralar 2011.", image: "images/image-5.png" },
    ];
    // @block-end define-dataset

    // @block-start create-collection
    let collection_name = "multimodal-embeddings";

    if !client.collection_exists(collection_name).await? {
        let mut vectors = VectorsConfigBuilder::default();
        vectors.add_named_vector_params("image", VectorParamsBuilder::new(512, Distance::Cosine));
        vectors.add_named_vector_params("text", VectorParamsBuilder::new(512, Distance::Cosine));

        client
            .create_collection(CreateCollectionBuilder::new(collection_name).vectors_config(vectors))
            .await?;
    }
    // @block-end create-collection

    // @block-start upload-data
    let cohere_api_key = std::env::var("COHERE_API_KEY")?;

    let mut options: HashMap<String, Value> = HashMap::new();
    options.insert("output_dimension".to_string(), 512i64.into());

    let mut points = Vec::new();
    for (idx, doc) in documents.iter().enumerate() {
        let vectors = NamedVectors::default()
            .add_vector(
                "text",
                DocumentBuilder::new(doc.caption, "cohere/embed-v4.0")
                    .options(options.clone())
                    .build(),
            )
            .add_vector(
                "image",
                ImageBuilder::new_from_base64(image_to_base64_url(doc.image)?, "cohere/embed-v4.0")
                    .options(options.clone())
                    .build(),
            );

        points.push(PointStruct::new(
            idx as u64,
            vectors,
            [
                ("caption", doc.caption.into()),
                ("image", doc.image.into()),
            ],
        ));
    }

    client
        .with_header("cohere-api-key", &cohere_api_key)
        .upsert_points(UpsertPointsBuilder::new(collection_name, points))
        .await?;
    // @block-end upload-data

    // @block-start text-to-image-search
    let results = client
        .with_header("cohere-api-key", &cohere_api_key)
        .query(
            QueryPointsBuilder::new(collection_name)
                .query(Query::new_nearest(
                    DocumentBuilder::new("Plane components", "cohere/embed-v4.0")
                        .options(options.clone())
                        .build(),
                ))
                .using("image")
                .with_payload(true)
                .limit(1),
        )
        .await?;

    println!("{:?}", results.result[0].payload.get("image"));
    // @block-end text-to-image-search

    // @block-start multilingual-search
    let results = client
        .with_header("cohere-api-key", &cohere_api_key)
        .query(
            QueryPointsBuilder::new(collection_name)
                .query(Query::new_nearest(
                    DocumentBuilder::new("Componenti di un aereo", "cohere/embed-v4.0")
                        .options(options.clone())
                        .build(),
                ))
                .using("image")
                .with_payload(true)
                .limit(1),
        )
        .await?;

    println!("{:?}", results.result[0].payload.get("image"));
    // @block-end multilingual-search

    // @block-start image-to-text-search
    let results = client
        .with_header("cohere-api-key", &cohere_api_key)
        .query(
            QueryPointsBuilder::new(collection_name)
                .query(Query::new_nearest(
                    ImageBuilder::new_from_base64(
                        image_to_base64_url("images/image-2.png")?,
                        "cohere/embed-v4.0",
                    )
                    .options(options.clone())
                    .build(),
                ))
                .using("text")
                .with_payload(true)
                .limit(1),
        )
        .await?;

    println!("{:?}", results.result[0].payload.get("caption"));
    // @block-end image-to-text-search

    Ok(())
}
