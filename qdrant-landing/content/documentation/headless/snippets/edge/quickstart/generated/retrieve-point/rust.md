```rust
use qdrant_edge::*;

let retrieved = edge_shard.retrieve(
    RetrieveRequestBuilder::new(vec![PointId::NumId(1)])
        .with_payload(WithPayloadInterface::Bool(true))
        .with_vector(WithVector::Bool(false))
        .build(),
)?;
```
