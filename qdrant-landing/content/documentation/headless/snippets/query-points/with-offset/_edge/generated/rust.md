```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: None,
        })))
        .with_vector(WithVector::Bool(true))
        .with_payload(WithPayloadInterface::Bool(true))
        .offset(100)
        .build(),
)?;
```
