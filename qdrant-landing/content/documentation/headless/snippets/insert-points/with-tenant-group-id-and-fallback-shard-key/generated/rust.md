```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PointStruct, ShardKeySelectorBuilder, UpsertPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

let shard_key_selector = ShardKeySelectorBuilder::with_shard_key("user_1")
    .fallback("default")
    .build();

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![
                PointStruct::new(
                    1,
                    vec![0.9, 0.1, 0.1],
                    [("group_id", "user_1".into())]
                ),
            ],
        )
        .shard_key_selector(shard_key_selector),
    )
    .await?;
```
