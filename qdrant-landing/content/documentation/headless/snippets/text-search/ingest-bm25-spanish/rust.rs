use std::collections::HashMap;

use qdrant_client::qdrant::{DocumentBuilder, PointStruct, UpsertPointsBuilder, Value};
use qdrant_client::{Payload, Qdrant};
use serde_json::json;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    let mut options = HashMap::new();
    options.insert("language".to_string(), Value::from("spanish"));

    let point = PointStruct::new(
        1,
        HashMap::from([(
            "title-bm25".to_string(),
            DocumentBuilder::new("La Máquina del Tiempo", "qdrant/bm25")
                .options(options)
                .build(),
        )]),
        Payload::try_from(json!({
            "title": "La Máquina del Tiempo",
            "author": "H.G. Wells",
            "isbn": "9788411486880",
        }))
        .unwrap(),
    );

    client
        .upsert_points(UpsertPointsBuilder::new("books", vec![point]).wait(true))
        .await?;

    Ok(())
}
