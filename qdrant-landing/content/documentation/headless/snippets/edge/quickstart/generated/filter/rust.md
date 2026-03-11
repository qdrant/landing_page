```rust
let filter = Filter {
    should: None,
    min_should: None,
    must: Some(vec![Condition::Field(FieldCondition::new_match(
        "color".try_into().unwrap(),
        Match::Value(MatchValue {
            value: ValueVariants::String("red".to_string()),
        }),
    ))]),
    must_not: None,
};

let results = edge_shard.query(ShardQueryRequest {
    prefetches: vec![],
    query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
        query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
        using: Some(VECTOR_NAME.to_string()),
    }))),
    filter: Some(filter),
    score_threshold: None,
    limit: 10,
    offset: 0,
    params: None,
    with_vector: WithVector::Bool(false),
    with_payload: WithPayloadInterface::Bool(true),
})?;
```
