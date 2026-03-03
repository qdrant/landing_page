```rust
let query = ShardQueryRequest {
    prefetches: vec![],
    query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
        query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
        using: Some(VECTOR_NAME.to_string()),
    }))),
    filter: None,
    score_threshold: None,
    limit: 10,
    offset: 0,
    params: None,
    with_vector: WithVector::Bool(false),
    with_payload: WithPayloadInterface::Bool(true),
};

let mut all_results = mutable_shard.query(query.clone())?;
all_results.extend(immutable_shard.query(query)?);

all_results.sort_by(|a, b| {
    b.score
        .partial_cmp(&a.score)
        .unwrap_or(std::cmp::Ordering::Equal)
});

let mut seen_ids = std::collections::HashSet::new();
let results: Vec<_> = all_results
    .into_iter()
    .filter(|p| seen_ids.insert(p.id.clone()))
    .take(10)
    .collect();
```
