```rust
use qdrant_client::qdrant::{Condition, DeletePointsBuilder, Filter};

client
    .delete_points(
        DeletePointsBuilder::new("{collection_name}")
            .points(Filter::must([Condition::matches(
                "color",
                "red".to_string(),
            )]))
            .wait(true),
    )
    .await?;
```
