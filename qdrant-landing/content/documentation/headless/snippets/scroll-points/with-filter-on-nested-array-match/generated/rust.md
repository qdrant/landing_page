```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::should([
            Condition::matches("country.cities[].sightseeing", "Osaka Castle".to_string()),
        ])),
    )
    .await?;
```
