```rust
use qdrant_client::{
    Qdrant, QdrantError,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

let client = Qdrant::from_url("<your-qdrant-url>").build().unwrap();

let mut options = HashMap::<String, Value>::new();
options.insert("openai-api-key".to_string(), "<YOUR_OPENAI_API_KEY>".into());
options.insert("dimensions".to_string(), 512.into());

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(Document {
                text: "How to bake cookies?".into(),
                model: "openai/text-embedding-3-large".into(),
                options,
            }))
            .build(),
    )
    .await?;
```
