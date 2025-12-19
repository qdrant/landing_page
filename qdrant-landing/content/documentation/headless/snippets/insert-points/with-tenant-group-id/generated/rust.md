```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .upsert_points(UpsertPointsBuilder::new(
        "{collection_name}",
        vec![
            PointStruct::new(1, vec![0.9, 0.1, 0.1], [("group_id", "user_1".into())]),
            PointStruct::new(2, vec![0.1, 0.9, 0.1], [("group_id", "user_1".into())]),
            PointStruct::new(3, vec![0.1, 0.1, 0.9], [("group_id", "user_2".into())]),
        ],
    ))
    .await?;
```
