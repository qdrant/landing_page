use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Document, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?;
    let mut options = HashMap::new();
    options.insert("openrouter-api-key".to_string(), "<YOUR_OPENROUTER_API_KEY>".into());

    client
        .upsert_points(UpsertPointsBuilder::new("{collection_name}",
            vec![
                PointStruct::new(1,
                    Document {
                      text: "Recipe for baking chocolate chip cookies".into(),
                      model: "openrouter/mistralai/mistral-embed-2312".into(),
                      options,
                      },
                    Payload::default())
                ]).wait(true))
            .await?;

    Ok(())
}
