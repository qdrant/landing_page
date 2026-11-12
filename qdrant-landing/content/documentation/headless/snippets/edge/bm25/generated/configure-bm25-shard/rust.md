```rust
const SHARD_DIRECTORY: &str = "./qdrant-edge-bm25";

use std::path::*;
use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .vector("embedding", EdgeVectorParamsBuilder::new(4, Distance::Cosine).build())
    .build();

let shard = EdgeShard::new(Path::new(SHARD_DIRECTORY), config)?;
```
