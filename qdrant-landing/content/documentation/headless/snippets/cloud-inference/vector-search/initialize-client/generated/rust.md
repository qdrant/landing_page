```rust
use qdrant_client::Qdrant;

let client = Qdrant::from_url("https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6334")
    .api_key("<paste-your-api-key-here>")
    .build()
    .unwrap();
```
