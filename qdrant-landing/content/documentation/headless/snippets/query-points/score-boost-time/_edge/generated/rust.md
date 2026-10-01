```rust
use qdrant_edge::*;

let _time_boosted = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(50)
                .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                    query: vec![0.1f32, 0.45, 0.67].into(), // <-- dense vector
                    using: None,
                })))
                .build(),
        )
        .query(ScoringQuery::Formula(
            Formula {
                // the final score = score + exp_decay(target_time - x_time)
                formula: Expression::Sum(vec![
                    Expression::Variable("$score".to_string()),
                    Expression::Decay {
                        kind: DecayKind::Exp,
                        x: Box::new(Expression::DatetimeKey(
                            "update_time".try_into().unwrap(), // payload key
                        )),
                        target: Some(Box::new(Expression::Datetime(
                            "YYYY-MM-DDT00:00:00Z".to_string(),
                        ))),
                        midpoint: Some(0.5),
                        scale: Some(86400.0), // 1 day in seconds
                    },
                ]),
                defaults: Default::default(),
            }
            .try_into()?,
        ))
        .build(),
)?;
```
