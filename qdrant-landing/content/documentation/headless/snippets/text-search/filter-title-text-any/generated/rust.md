```rust
use qdrant_client::qdrant::{Condition, DocumentBuilder, Filter, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

let filter = Filter::must([Condition::matches("title", "space war".to_string())]);

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("space opera", "sentence-transformers/all-minilm-l6-v2")
                    .build(),
            ))
            .using("description-dense")
            .filter(filter)
            .with_payload(true)
            .build(),
    )
    .await?;
```
