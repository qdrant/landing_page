```rust
use std::path::*;
use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .wal_options(WalOptions {
        segment_capacity: 4 * 1024 * 1024,
        ..Default::default()
    })
    .build();

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), Some(config))?;
```
