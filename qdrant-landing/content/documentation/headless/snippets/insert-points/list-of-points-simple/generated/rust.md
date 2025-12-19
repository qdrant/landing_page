```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![
                PointStruct::new(1, vec![0.9, 0.1, 0.1], [("city", "red".into())]),
                PointStruct::new(2, vec![0.1, 0.9, 0.1], [("city", "green".into())]),
                PointStruct::new(3, vec![0.1, 0.1, 0.9], [("city", "blue".into())]),
            ],
        )
        .wait(true),
    )
    .await?;
```
