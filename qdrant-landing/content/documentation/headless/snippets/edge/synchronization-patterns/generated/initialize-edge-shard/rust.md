```rust
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(SHARD_DIRECTORY)?;
let config = EdgeShardConfig {
    on_disk_payload: true,
    vectors: HashMap::from([(
        VECTOR_NAME.to_string(),
        EdgeVectorParams {
            size: VECTOR_DIMENSION,
            distance: qdrant_edge::segment::types::Distance::Cosine,
            on_disk: Some(true),
            quantization_config: None,
            multivector_config: None,
            datatype: None,
            hnsw_config: None,
        },
    )]),
    sparse_vectors: HashMap::new(),
    hnsw_config: Default::default(),
    quantization_config: None,
    optimizers: Default::default(),
};

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), Some(config))?;
```
