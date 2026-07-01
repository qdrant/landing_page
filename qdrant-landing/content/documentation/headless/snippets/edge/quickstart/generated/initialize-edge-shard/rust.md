```rust
use std::path::*;
use qdrant_edge::*;

let edge_shard = EdgeShard::new(
    Path::new(SHARD_DIRECTORY),
    config,
)?;
```
