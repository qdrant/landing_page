```rust
use qdrant_edge::*;
use qdrant_edge::external::ordered_float::OrderedFloat;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: None,
        })))
        .params(SearchParams {
            acorn: Some(AcornSearchParams {
                enable: true,
                max_selectivity: Some(OrderedFloat(0.4)),
            }),
            ..Default::default()
        })
        .build(),
)?;
```
