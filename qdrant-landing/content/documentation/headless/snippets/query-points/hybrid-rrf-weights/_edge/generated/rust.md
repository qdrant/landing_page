```rust
use qdrant_edge::*;
use qdrant_edge::external::ordered_float::OrderedFloat;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        // .add_prefetch(...)  <┐
        // .add_prefetch(...)  <┴─ 2+ prefetches here
        .query(ScoringQuery::Fusion(Fusion::Rrf {
            k: 2,
            weights: Some(vec![OrderedFloat(3.0f32), OrderedFloat(1.0f32)]),
        }))
        .build(),
)?;
```
