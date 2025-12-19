use std::collections::HashMap;

use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder, Value};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> { // @hide
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let mut options = HashMap::new();
    options.insert("tokenizer".to_string(), Value::from("multilingual"));

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_nearest(Document {
                    text: "村上春樹".into(),
                    model: "qdrant/bm25".into(),
                    options,
                }))
                .using("author-bm25")
                .limit(10)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
} // @hide
