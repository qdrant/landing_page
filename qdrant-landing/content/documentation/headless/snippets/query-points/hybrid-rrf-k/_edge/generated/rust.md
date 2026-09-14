```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        // .add_prefetch(...)  <┐
        // .add_prefetch(...)  <┴─ 2+ prefetches here
        .query(ScoringQuery::Fusion(Fusion::Rrf { k: 60, weights: None }))
        .build(),
)?;
```
