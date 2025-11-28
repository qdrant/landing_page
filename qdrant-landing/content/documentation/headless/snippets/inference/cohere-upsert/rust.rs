use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Document, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?;
    let mut options = HashMap::new();
    options.insert("cohere-api-key".to_string(), "<YOUR_COHERE_API_KEY>".into());
    options.insert("output_dimension".to_string(), 512.into());

    client
        .upsert_points(UpsertPointsBuilder::new("{collection_name}",
            vec![
                PointStruct::new(1,
                    Document {
                      text: "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.".into(),
                      model: "openai/text-embedding-3-small".into(),
                      options,
                      },
                    Payload::default())
                ]).wait(true))
            .await?;

    Ok(())
}
