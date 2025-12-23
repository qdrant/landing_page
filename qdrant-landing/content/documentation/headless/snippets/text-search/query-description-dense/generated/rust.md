```rust
use qdrant_client::qdrant::{DocumentBuilder, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("time travel", "sentence-transformers/all-minilm-l6-v2")
                    .build(),
            ))
            .using("description-dense")
            .with_payload(true)
            .build(),
    )
    .await?;
```
