```rust
use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

let mut options = HashMap::<String, Value>::new();
options.insert("dimensions".to_string(), 512.into());

client
    .with_header("jina-api-key", "<YOUR_JINAAI_API_KEY>")
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(Document {
                text: "Mission to Mars".into(),
                model: "jinaai/jina-clip-v2".into(),
                options,
            }))
            .build(),
    )
    .await?;
```
