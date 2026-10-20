```rust
use qdrant_client::qdrant::{ContextInputBuilder, DiscoverInputBuilder, QueryPointsBuilder};

client
    .query(
        QueryPointsBuilder::new("{collection_name}").query(
            DiscoverInputBuilder::new(
                vec![0.2, 0.1, 0.9, 0.7],
                ContextInputBuilder::default()
                    .add_pair(100, 718)
                    .add_pair(200, 300),
            )
            .build(),
        ),
    )
    .await?;
```
