```rust
use std::collections::HashMap;

use qdrant_edge::external::serde_json::json;
use qdrant_edge::*;

let _geo_boosted = edge_shard.query(
    QueryRequestBuilder::new(10)
        .add_prefetch(
            PrefetchBuilder::new(100)
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
                    Expression::Decay {
                        kind: DecayKind::Gauss,
                        x: Box::new(Expression::GeoDistance {
                            // Berlin
                            origin: GeoPoint::new(13.393236, 52.504043).unwrap(),
                            to: "geo.location".try_into().unwrap(),
                        }),
                        target: None,
                        midpoint: None,
                        scale: Some(5_000.0),
                    },
                ]),
                // Munich
                defaults: HashMap::from([(
                    "geo.location".to_string(),
                    json!({ "lat": 48.137154, "lon": 11.576124 }),
                )]),
            }
            .try_into()?,
        ))
        .build(),
)?;
```
