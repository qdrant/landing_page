```rust
use qdrant_client::{
    Qdrant, QdrantError,
    qdrant::{Document, Query, QueryPointsBuilder},
};

let client = Qdrant::from_url("http://localhost:6333").build().unwrap();

client
    .query(
        QueryPointsBuilder::new("<your-collection_name>")
            .query(Query::new_nearest(Document {
                text: "How to bake cookies?".into(),
                model: "qdrant/bm25".into(),
                ..Default::default()
            }))
            .using("my-bm25-vector")
            .build(),
    )
    .await?;
```
