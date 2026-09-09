```rust
use qdrant_client::qdrant::{
    CreateShardKeyBuilder, CreateShardKeyRequestBuilder
};
use qdrant_client::qdrant::ReplicaState;
use qdrant_client::Qdrant;

client
    .create_shard_key(
        CreateShardKeyRequestBuilder::new("{collection_name}")
            .request(
                CreateShardKeyBuilder::default()
                    .shard_key("user_1".to_string())
                    .shards_number(1)
                    .replication_factor(1)
                    .initial_state(ReplicaState::Partial)
            ),
    )
    .await?;
```
