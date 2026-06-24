use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Document, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?; // @hide

    client
        .with_header("openai-api-key", "<YOUR_OPENAI_API_KEY>")
        .upsert_points(
            UpsertPointsBuilder::new(
                "{collection_name}",
                vec![PointStruct::new(
                    1,
                    Document {
                        text: "Recipe for baking chocolate chip cookies".into(),
                        model: "openai/text-embedding-3-large".into(),
                        options: HashMap::new(),
                    },
                    Payload::default(),
                )],
            )
            .wait(true),
        )
        .await?;

    Ok(())
}
