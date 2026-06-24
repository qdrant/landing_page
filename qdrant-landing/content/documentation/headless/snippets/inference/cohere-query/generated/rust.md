```rust
use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

let mut options = HashMap::<String, Value>::new();
options.insert("output_dimension".to_string(), 512.into());

client
    .with_header("cohere-api-key", "<YOUR_COHERE_API_KEY>")
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(Document {
                text: "a green square".into(),
                model: "cohere/embed-v4.0".into(),
                options,
            }))
            .build(),
    )
    .await?;
```
