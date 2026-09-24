```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(3)
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: None,
        })))
        .filter(Filter::new_must(Condition::Field(FieldCondition::new_match(
            "city".try_into().unwrap(),
            Match::Value(MatchValue {
                value: ValueVariants::String("London".to_string()),
            }),
        ))))
        .params(SearchParams {
            hnsw_ef: Some(128),
            exact: false,
            ..Default::default()
        })
        .build(),
)?;
```
