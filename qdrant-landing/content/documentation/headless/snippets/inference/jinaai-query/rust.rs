use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build().unwrap();

    let mut options = HashMap::<String, Value>::new();
    options.insert("jina-api-key".to_string(), "<YOUR_JINAAI_API_KEY>".into());
    options.insert("dimensions".to_string(), 512.into());

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(Query::new_nearest(Document {
                    text: "Mission to Mars".into(),
                    model: "jinaai/jina-clip-v2".into(),
                    options,
                }))
                .build(),
        )
        .await?;

    Ok(())
}
