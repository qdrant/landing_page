use qdrant_client::{
    Payload, Qdrant, QdrantError,
    qdrant::{Document, PointStruct, UpsertPointsBuilder, Vectors},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?;

    let mut jina_options = HashMap::new();
    jina_options.insert("jina-api-key".to_string(), "<YOUR_JINAAI_API_KEY>".into());
    jina_options.insert("dimensions".to_string(), 512.into());

    client
        .upsert_points(
            UpsertPointsBuilder::new(
                "{collection_name}",
                vec![PointStruct::new(
                    1,
                    NamedVectors::default()
                        .add_vector(
                            "image",
                            Image {
                                image: Some("https://qdrant.tech/example.png".into()),
                                model: "jinaai/jina-clip-v2".into(),
                                options: jina_options,
                            },
                        )
                        .add_vector(
                            "text",
                            Document {
                                text: "Mars, the red planet".into(),
                                model: "sentence-transformers/all-minilm-l6-v2".into(),
                                ..Default::default()
                            },
                        )
                        .add_vector(
                            "bm25",
                            Document {
                                text: "How to bake cookies?".into(),
                                model: "qdrant/bm25".into(),
                                ..Default::default()
                            },
                        ),
                    Payload::default(),
                )],
            )
            .wait(true),
        )
        .await?;

    Ok(())
}
