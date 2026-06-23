use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build().unwrap(); // @hide

    let mut options = HashMap::<String, Value>::new();
    options.insert("dimensions".to_string(), 512.into());

    client
        .with_header("openai-api-key", "<YOUR_OPENAI_API_KEY>")
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(Query::new_nearest(Document {
                    text: "How to bake cookies?".into(),
                    model: "openai/text-embedding-3-large".into(),
                    options,
                }))
                .build(),
        )
        .await?;

    Ok(())
}
