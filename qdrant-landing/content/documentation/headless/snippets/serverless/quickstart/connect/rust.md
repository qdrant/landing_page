```rust
use qdrant_client::serverless::QdrantServerless;

let client = QdrantServerless::from_url("https://serverless.<region>.cloud.qdrant.io")
    .api_key("<your-api-key>")
    .build()?;
```
