```rust
const MUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/mutable";
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(MUTABLE_SHARD_DIR)?;
let config = SegmentConfig {
    vector_data: {
        let mut m = HashMap::new();
        m.insert(
            VECTOR_NAME.to_string(),
            VectorDataConfig {
                size: VECTOR_DIMENSION,
                distance: Distance::Cosine,
                storage_type: VectorStorageType::ChunkedMmap,
                index: Default::default(),
                quantization_config: None,
                multivector_config: None,
                datatype: None,
            },
        );
        m
    },
    sparse_vector_data: HashMap::new(),
    payload_storage_type: PayloadStorageType::Mmap,
};

let mutable_shard = EdgeShard::load(Path::new(MUTABLE_SHARD_DIR), Some(config))?;
```
