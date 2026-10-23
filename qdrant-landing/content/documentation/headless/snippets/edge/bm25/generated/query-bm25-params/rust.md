```rust
use qdrant_edge::*;

let results = shard.query(
    QueryRequestBuilder::new(3)
        .query(
            TextQueryBuilder::new("title".try_into().unwrap(), "time travel")
                .scoring(TextQueryScoring::Bm25(
                    Bm25ParamsBuilder::new().k(1.5).b(0.5).build(),
                ))
                .build(),
        )
        .with_payload(WithPayloadInterface::Bool(true))
        .build(),
)?;
```
