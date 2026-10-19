```rust
use qdrant_edge::*;

let results = shard.query(
    QueryRequestBuilder::new(3)
        .query(TextQueryBuilder::new("title".try_into().unwrap(), "time travel").build())
        .with_payload(WithPayloadInterface::Bool(true))
        .build(),
)?;
```
