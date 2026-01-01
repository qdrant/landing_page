```rust
use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(Document::new(
                "time travel",
                "sentence-transformers/all-minilm-l6-v2",
            )))
            .using("description-dense")
            .with_payload(true)
            .build(),
    )
    .await?;
```
