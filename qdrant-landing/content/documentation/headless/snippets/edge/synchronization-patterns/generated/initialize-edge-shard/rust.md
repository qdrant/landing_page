```rust
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(SHARD_DIRECTORY)?;
let config = EdgeConfigBuilder::new()
    .on_disk_payload(true)
    .vector(
        VECTOR_NAME,
        EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, qdrant_edge::Distance::Cosine)
            .on_disk(true)
            .build(),
    )
    .build();

let edge_shard = EdgeShard::new(
    Path::new(SHARD_DIRECTORY),
    config,
)?;
```
