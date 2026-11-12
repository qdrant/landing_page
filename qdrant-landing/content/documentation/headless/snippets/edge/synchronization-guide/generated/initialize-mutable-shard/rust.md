```rust
use std::path::*;
use qdrant_edge::*;

const MUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/mutable";
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(MUTABLE_SHARD_DIR)?;
let config = EdgeConfigBuilder::new()
    .payload_memory(Memory::Cold)
    .vector(
        VECTOR_NAME,
        EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, Distance::Cosine)
            .memory(Memory::Cold)
            .build(),
    )
    .build();

let mutable_shard = EdgeShard::new(
    Path::new(MUTABLE_SHARD_DIR),
    config,
)?;
```
