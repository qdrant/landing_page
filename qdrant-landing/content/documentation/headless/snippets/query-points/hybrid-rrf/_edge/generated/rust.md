```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(20)
                .query(TextQueryBuilder::new("title".try_into().unwrap(), "time travel").build())
                .build(),
        )
        .add_prefetch(
            PrefetchBuilder::new(20)
                .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                    query: vec![0.01f32, 0.45, 0.67].into(),
                    using: Some("dense".to_string()),
                })))
                .build(),
        )
        .query(ScoringQuery::Fusion(Fusion::Rrf { k: 2, weights: None }))
        .build(),
)?;
```
