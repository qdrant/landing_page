```rust
use qdrant_client::{
    Qdrant, QdrantError,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

let client = Qdrant::from_url("http://localhost:6333").build().unwrap();

let mut options = HashMap::<String, Value>::new();
options.insert("jina-api-key".to_string(), "<YOUR_JINAAI_API_KEY>".into());
options.insert("dimensions".to_string(), 512.into());

client
    .query(
        QueryPointsBuilder::new("<your-collection_name>")
            .query(Query::new_nearest(Document {
                text: "Mission to Mars".into(),
                model: "jinaai/jina-clip-v2".into(),
                options,
            }))
            .build(),
    )
    .await?;
```
