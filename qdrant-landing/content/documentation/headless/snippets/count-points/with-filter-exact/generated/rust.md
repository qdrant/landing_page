```rust
use qdrant_client::qdrant::{Condition, CountPointsBuilder, Filter};

client
    .count(
        CountPointsBuilder::new("{collection_name}")
            .filter(Filter::must([Condition::matches(
                "color",
                "red".to_string(),
            )]))
            .exact(true),
    )
    .await?;
```
