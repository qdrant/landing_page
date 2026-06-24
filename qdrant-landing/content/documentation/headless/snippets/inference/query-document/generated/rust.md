```rust
use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder},
};

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(Document {
                text: "My Query Text".into(),
                model: "<the-model-to-use>".into(),
                ..Default::default()
            }))
            .build(),
    )
    .await?;
```
