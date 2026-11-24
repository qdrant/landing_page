```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter {
            must: vec![Condition::matches("city", "London".to_string())],
            must_not: vec![Condition::matches("color", "red".to_string())],
            ..Default::default()
        }),
    )
    .await?;
```
