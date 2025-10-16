```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Document};
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

let client = Qdrant::from_url("https://xyz-example.qdrant.io:6334")
    .api_key("<paste-your-api-key-here>")
    .build()
    .unwrap();
```
