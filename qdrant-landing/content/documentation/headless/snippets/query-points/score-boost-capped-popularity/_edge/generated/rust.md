```rust
use qdrant_edge::*;

let _capped_boost = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(50)
                .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                    query: vec![0.01f32, 0.45, 0.67].into(),
                    using: None,
                })))
                .build(),
        )
        .query(ScoringQuery::Formula(
            Formula {
                formula: Expression::Sum(vec![
                    Expression::Variable("$score".to_string()),
                    Expression::Min(vec![
                        // the boost can't exceed this value
                        Expression::Constant(2.0),
                        Expression::Mult(vec![
                            Expression::Constant(0.1),
                            Expression::Variable("log_views".to_string()),
                        ]),
                    ]),
                ]),
                defaults: Default::default(),
            }
            .try_into()?,
        ))
        .build(),
)?;
```
