```rust
use qdrant_client::qdrant::{Condition, Document, Filter, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let filter = Filter::must([Condition::matches("title", "space war".to_string())]);

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
