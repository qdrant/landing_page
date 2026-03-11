```rust
const MUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/mutable";
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(MUTABLE_SHARD_DIR)?;
let config = EdgeShardConfig {
    on_disk_payload: true,
    vectors: HashMap::from([(
        VECTOR_NAME.to_string(),
        EdgeVectorParams {
            size: VECTOR_DIMENSION,
            distance: Distance::Cosine,
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

let mutable_shard = EdgeShard::load(Path::new(MUTABLE_SHARD_DIR), Some(config))?;
```
