```rust
let client = Qdrant::from_url(&std::env::var("QDRANT_URL")?)
    .api_key(std::env::var("QDRANT_API_KEY")?)
    .build()?;
```
