```rust
use qdrant_client::{
    Payload, Qdrant, QdrantError,
    qdrant::{Document, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

let client = Qdrant::from_url("http://localhost:6333").build()?;
let mut options = HashMap::new();
options.insert("openai-api-key".to_string(), "<YOUR_OPENAI_API_KEY>".into());
options.insert("dimensions".to_string(), 512.into());

client
    .upsert_points(UpsertPointsBuilder::new("<your-collection>",
        vec![
            PointStruct::new(1,
                Document {
                  text: "Recipe for baking chocolate chip cookies".into(),
                  model: "openai/text-embedding-3-large".into(),
                  options,
                  },
                Payload::default())
            ]).wait(true))
        .await?;
```
