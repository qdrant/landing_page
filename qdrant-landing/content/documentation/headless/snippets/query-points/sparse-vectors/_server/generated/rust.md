```rust
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![(1, 0.2), (3, 0.1), (5, 0.9), (7, 0.7)])
            .limit(10)
            .using("text"),
    )
    .await?;
```
