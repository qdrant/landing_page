```rust
let query_vector = bm25.embed_query("clever fox");

let results = shard.query(QueryRequest {
    prefetches: vec![],
    query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
        query: VectorInternal::from(query_vector),
        using: Some("text".to_string()),
    }))),
    filter: None,
    score_threshold: None,
    limit: 3,
    offset: 0,
    params: None,
    with_vector: WithVector::Bool(false),
    with_payload: WithPayloadInterface::Bool(true),
})?;
```
