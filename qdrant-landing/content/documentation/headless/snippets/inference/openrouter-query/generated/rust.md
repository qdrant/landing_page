```rust
use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

let client = Qdrant::from_url("<your-qdrant-url>").build().unwrap();

let mut options = HashMap::<String, Value>::new();
options.insert("openrouter-api-key".to_string(), "<YOUR_OPENROUTER_API_KEY>".into());

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(Document {
                text: "How to bake cookies?".into(),
                model: "openrouter/mistralai/mistral-embed-2312".into(),
                options,
            }))
            .build(),
    )
    .await?;
```
