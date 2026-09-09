```rust
use qdrant_edge::*;

let query_vector = bm25.embed_query("clever fox");

let results = shard.query(
    QueryRequestBuilder::new(3)
        .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: VectorInternal::from(query_vector),
            using: Some("text".to_string()),
        })))
        .with_payload(WithPayloadInterface::Bool(true))
        .build(),
)?;
```
