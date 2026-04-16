```rust
let today = "2026-04-08";
let oldest_shard_key = (NaiveDate::parse_from_str(today, "%Y-%m-%d")?
    - chrono::Duration::days(7))
.to_string();

client
    .create_shard_key(
        CreateShardKeyRequestBuilder::new(collection_name)
            .request(CreateShardKeyBuilder::default().shard_key(today.to_string())),
    )
    .await?;

client
    .delete_shard_key(
        DeleteShardKeyRequestBuilder::new(collection_name)
            .key(shard_key::Key::Keyword(oldest_shard_key)),
    )
    .await?;
```
