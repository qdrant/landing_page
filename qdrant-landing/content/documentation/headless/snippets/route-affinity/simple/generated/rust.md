```rust
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::Qdrant;

client
    .with_header("X-Qdrant-Route-Affinity", "user-42")
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3),
    )
    .await?;
```
