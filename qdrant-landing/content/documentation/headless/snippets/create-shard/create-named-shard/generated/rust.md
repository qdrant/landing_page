```rust
use qdrant_client::qdrant::{
    CreateShardKeyBuilder, CreateShardKeyRequestBuilder
};
use qdrant_client::Qdrant;

client
    .create_shard_key(
        CreateShardKeyRequestBuilder::new("{collection_name}")
            .request(CreateShardKeyBuilder::default().shard_key("{shard_key}".to_string())),
    )
    .await?;
```
