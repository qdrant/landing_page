```rust
use qdrant_client::Qdrant;

client
    .with_header("x-request-id", "my-trace-id")
    .list_collections()
    .await?;
```
