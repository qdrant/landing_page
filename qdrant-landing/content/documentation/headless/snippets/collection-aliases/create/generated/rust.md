```rust
use qdrant_client::qdrant::CreateAliasBuilder;

client
    .create_alias(CreateAliasBuilder::new(
        "example_collection",
        "production_collection",
    ))
    .await?;
```
