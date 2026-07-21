```rust
let qdrant_url = std::env::var("QDRANT_URL")?;
let qdrant_api_key = std::env::var("QDRANT_API_KEY")?;

let client = Qdrant::from_url(&qdrant_url)
    .api_key(qdrant_api_key)
    .build()?;
```
