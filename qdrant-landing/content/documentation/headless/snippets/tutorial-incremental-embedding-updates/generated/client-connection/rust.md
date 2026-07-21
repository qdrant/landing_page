```rust
// Replace the URL and API key with your own from https://cloud.qdrant.io
let client = Qdrant::from_url("https://xyz-example.qdrant.io:6334")
    .api_key("<your-api-key>")
    .build()?;
```
