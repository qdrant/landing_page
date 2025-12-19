```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{Document, PointStruct, UpsertPointsBuilder};
use qdrant_client::{Payload, Qdrant};
use serde_json::json;

let point = PointStruct::new(
    1,
    HashMap::from([(
        "title-bm25".to_string(),
        Document {
            text: "The Time Machine".into(),
            model: "qdrant/bm25".into(),
            ..Default::default()
        },
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
```
