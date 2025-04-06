```rust
use qdrant_client::qdrant::{Condition, DeletePayloadPointsBuilder, Filter};

client
    .delete_payload(
        DeletePayloadPointsBuilder::new(
            "{collection_name}",
            vec!["color".to_string(), "price".to_string()],
        )
        .points_selector(Filter::must([Condition::matches(
            "color",
            "red".to_string(),
        )]))
        .wait(true),
    )
    .await?;
```
