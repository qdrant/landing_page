```rust
use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .max_search_threads(4)
    .search_pool_core(0)
    .build();

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), Some(config))?;
```
