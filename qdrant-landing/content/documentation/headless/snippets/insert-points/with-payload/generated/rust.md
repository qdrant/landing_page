```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::{Payload, Qdrant, QdrantError};
use serde_json::json;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let points = vec![
    PointStruct::new(
        1,
        vec![0.05, 0.61, 0.76, 0.74],
        Payload::try_from(json!({"city": "Berlin", "price": 1.99})).unwrap(),
    ),
    PointStruct::new(
        2,
        vec![0.19, 0.81, 0.75, 0.11],
        Payload::try_from(json!({"city": ["Berlin", "London"]})).unwrap(),
    ),
    PointStruct::new(
        3,
        vec![0.36, 0.55, 0.47, 0.94],
        Payload::try_from(json!({"city": ["Berlin", "Moscow"], "price": [1.99, 2.99]}))
            .unwrap(),
    ),
];

client
    .upsert_points(UpsertPointsBuilder::new("{collection_name}", points).wait(true))
    .await?;
```
