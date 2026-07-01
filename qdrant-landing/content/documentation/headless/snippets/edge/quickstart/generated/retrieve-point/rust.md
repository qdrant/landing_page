```rust
use qdrant_edge::*;

let retrieved = edge_shard.retrieve(
    &[PointId::NumId(1)],
    Some(WithPayloadInterface::Bool(true)),
    Some(WithVector::Bool(false)),
)?;
```
