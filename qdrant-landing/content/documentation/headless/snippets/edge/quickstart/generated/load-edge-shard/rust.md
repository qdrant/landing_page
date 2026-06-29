```rust
use std::path::*;
use qdrant_edge::*;

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), None)?;
```
