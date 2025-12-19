```rust
use qdrant_client::qdrant::{Condition, Document, Filter, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

let filter = Filter::must([
    Condition::matches("author", "Larry Niven".to_string()),
    Condition::matches("author", "Jerry Pournelle".to_string()),
]);

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(Document {
                text: "space opera".into(),
                model: "sentence-transformers/all-minilm-l6-v2".into(),
                ..Default::default()
            }))
            .using("description-dense")
            .filter(filter)
            .with_payload(true)
            .build(),
    )
    .await?;
```
