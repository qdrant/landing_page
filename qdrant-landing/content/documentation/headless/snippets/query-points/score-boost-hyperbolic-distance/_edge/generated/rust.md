```rust
use qdrant_edge::*;

let _geodesic = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(100)
                // the sign of the first element is flipped
                .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                    query: vec![-1.118f32, 0.3, 0.4].into(),
                    using: None,
                })))
                .build(),
        )
        .query(ScoringQuery::Formula(
            Formula {
                formula: Expression::Neg(Box::new(Expression::Acosh(Box::new(
                    Expression::Neg(Box::new(Expression::Variable("$score".to_string()))),
                )))),
                defaults: Default::default(),
            }
            .try_into()?,
        ))
        .build(),
)?;
```
