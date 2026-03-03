```rust
const VECTOR_NAME: &str = "my-vector";
const VECTOR_DIMENSION: usize = 4;

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
```
