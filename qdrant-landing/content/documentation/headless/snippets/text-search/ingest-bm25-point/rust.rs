use std::collections::HashMap;

use qdrant_client::qdrant::{DocumentBuilder, PointStruct, UpsertPointsBuilder};
use qdrant_client::{Payload, Qdrant};
use serde_json::json;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let point = PointStruct::new(
        1,
        HashMap::from([(
            "title-bm25".to_string(),
            DocumentBuilder::new("The Time Machine", "qdrant/bm25").build(),
        )]),
        Payload::try_from(json!({
            "title": "The Time Machine",
            "author": "H.G. Wells",
            "isbn": "9780553213515",
        }))
        .unwrap(),
    );

    client
        .upsert_points(UpsertPointsBuilder::new("books", vec![point]).wait(true))
        .await?;

    Ok(())
}
