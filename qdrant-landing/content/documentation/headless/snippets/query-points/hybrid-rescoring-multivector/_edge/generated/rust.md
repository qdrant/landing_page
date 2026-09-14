```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(100)
                .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                    query: vec![0.01f32, 0.45, 0.67].into(),
                    using: None,
                })))
                .build(),
        )
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: TypedMultiDenseVector::<f32>::try_from_matrix(vec![
                vec![0.1f32, 0.2, 0.32],  // <─┐
                vec![0.2, 0.1, 0.52],      // < ├─ multi-vector
                vec![0.8, 0.9, 0.93],      // < ┘
            ])?.into(),
            using: Some("colbert".to_string()),
        })))
        .build(),
)?;
```
