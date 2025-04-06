```rust
use qdrant_client::qdrant::{QueryPointsBuilder, RecommendInputBuilder};

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(
                RecommendInputBuilder::default()
                    .add_positive(100)
                    .add_positive(231)
                    .add_negative(718)
                    .build(),
            )
            .limit(10)
            .using("image"),
    )
    .await?;
```
