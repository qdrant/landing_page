use std::collections::HashMap;

use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder, Value};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> { // @hide
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let mut options = HashMap::new();
    options.insert("language".to_string(), Value::from("spanish"));

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_nearest(Document {
                    text: "tiempo".into(),
                    model: "qdrant/bm25".into(),
                    options,
                }))
                .using("title-bm25")
                .limit(10)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
} // @hide
