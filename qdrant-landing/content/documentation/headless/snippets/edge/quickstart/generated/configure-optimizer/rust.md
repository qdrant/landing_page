```rust
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
    optimizers: EdgeOptimizersConfig {
        deleted_threshold: Some(0.2),
        vacuum_min_vector_number: Some(100),
        default_segment_number: Some(2),
        ..Default::default()
    },
};
```
