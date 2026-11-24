```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};
use qdrant_client::Qdrant;

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must_not([
            Condition::matches("city", "london".to_string()),
            Condition::matches("color", "red".to_string()),
        ])),
    )
    .await?;
```
