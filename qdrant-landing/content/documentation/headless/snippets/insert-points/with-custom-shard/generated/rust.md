```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Payload;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                111,
                vec![0.1, 0.2, 0.3],
                Payload::default(),
            )],
        )
        .shard_key_selector("user_1".to_string()),
    )
    .await?;
```
