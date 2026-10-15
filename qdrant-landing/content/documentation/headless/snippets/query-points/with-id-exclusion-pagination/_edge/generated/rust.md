```rust
use qdrant_edge::*;

let seen_ids = vec![83461u64, 19284, 57392, 44017, 91825]; // IDs returned on previous pages

let results = edge_shard.query(
    QueryRequestBuilder::new(5)
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: None,
        })))
        .filter(Filter::new_must_not(Condition::HasId(
            seen_ids.into_iter().map(PointId::NumId).collect(),
        )))
        .build(),
)?;
```
