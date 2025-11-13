```rust
use qdrant_client::{
    Payload, Qdrant, QdrantError,
    qdrant::{Image, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

let client = Qdrant::from_url("http://localhost:6333").build()?;
let mut options = HashMap::new();
options.insert("jina-api-key".to_string(), "<YOUR_JINAAI_API_KEY>".into());
options.insert("dimensions".to_string(), 512.into());

client
    .upsert_points(UpsertPointsBuilder::new("<your-collection>",
        vec![
            PointStruct::new(1,
                Image {
                  image: Some("https://qdrant.tech/example.png".into()),
                  model: "jinaai/jina-clip-v2".into(),
                  options,
                  },
                Payload::default())
            ]).wait(true))
        .await?;
```
