```rust
use qdrant_client::{
    Qdrant, QdrantError,
    qdrant::{Document, Query, QueryPointsBuilder, Value},
};
use std::collections::HashMap;

let client = Qdrant::from_url("http://localhost:6333").build().unwrap();

let mut options = HashMap::<String, Value>::new();
options.insert("cohere-api-key".to_string(), "<YOUR_COHERE_API_KEY>".into());
options.insert("output_dimension".to_string(), 512.into());

client
    .query(
        QueryPointsBuilder::new("<your-collection_name>")
            .query(Query::new_nearest(Document {
                text: "a green square".into(),
                model: "cohere/embed-v4.0".into(),
                options,
            }))
            .build(),
    )
    .await?;
```
