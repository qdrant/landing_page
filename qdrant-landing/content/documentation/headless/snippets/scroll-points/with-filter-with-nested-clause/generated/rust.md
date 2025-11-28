```rust
use qdrant_client::qdrant::{Condition, Filter, NestedCondition, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([NestedCondition {
            key: "diet".to_string(),
            filter: Some(Filter::must([
                Condition::matches("food", "meat".to_string()),
                Condition::matches("likes", true),
            ])),
        }
        .into()])),
    )
    .await?;
```
