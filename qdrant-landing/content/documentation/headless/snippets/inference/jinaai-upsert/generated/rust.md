```rust
use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Image, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

let mut options = HashMap::new();
options.insert("dimensions".to_string(), 512.into());

client
    .with_header("jina-api-key", "<YOUR_JINAAI_API_KEY>")
    .upsert_points(UpsertPointsBuilder::new("{collection_name}",
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
