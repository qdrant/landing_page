```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::should([
            Condition::matches("country.name", "Germany".to_string()),
        ])),
    )
    .await?;
```
