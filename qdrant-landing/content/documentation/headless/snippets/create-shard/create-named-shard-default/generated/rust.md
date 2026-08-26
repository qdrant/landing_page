```rust
use qdrant_client::qdrant::{
    CreateShardKeyBuilder, CreateShardKeyRequestBuilder
};
use qdrant_client::Qdrant;

client
    .create_shard_key(
        CreateShardKeyRequestBuilder::new("{collection_name}")
            .request(CreateShardKeyBuilder::default().shard_key("default".to_string()).shards_number(1)),
    )
    .await?;
```
