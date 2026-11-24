```rust
use qdrant_edge::*;

let sampled = edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(ScoringQuery::Sample(Sample::Random))
        .build(),
)?;
```
