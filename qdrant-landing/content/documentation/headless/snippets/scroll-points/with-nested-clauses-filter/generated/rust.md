```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must_not([Filter::must(
            [
                Condition::matches("city", "London".to_string()),
                Condition::matches("color", "red".to_string()),
            ],
        )
        .into()])),
    )
    .await?;
```
