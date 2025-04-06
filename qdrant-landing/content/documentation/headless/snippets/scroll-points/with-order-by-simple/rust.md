```rust
use qdrant_client::qdrant::{OrderByBuilder, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}")
            .limit(15)
            .order_by(OrderByBuilder::new("timestamp")),
    )
    .await?;
```
