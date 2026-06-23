```rust
use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder},
};
use std::collections::HashMap;

client
    .with_header("openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>")
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(Document {
                text: "How to bake cookies?".into(),
                model: "openrouter/mistralai/mistral-embed-2312".into(),
                options: HashMap::new(),
            }))
            .build(),
    )
    .await?;
```
