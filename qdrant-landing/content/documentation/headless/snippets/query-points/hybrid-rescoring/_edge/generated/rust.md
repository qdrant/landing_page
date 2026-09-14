```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(1000)
                .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                    query: vec![1.0f32, 23.0, 45.0, 67.0].into(),
                    using: Some("mrl_byte".to_string()),
                })))
                .build(),
        )
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.01f32, 0.299, 0.45, 0.67].into(),
            using: Some("full".to_string()),
        })))
        .build(),
)?;
```
