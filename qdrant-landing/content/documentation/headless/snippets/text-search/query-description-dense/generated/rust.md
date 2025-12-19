```rust
use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(Document {
                text: "time travel".into(),
                model: "sentence-transformers/all-minilm-l6-v2".into(),
                ..Default::default()
            }))
            .using("description-dense")
            .with_payload(true)
            .build(),
    )
    .await?;
```
