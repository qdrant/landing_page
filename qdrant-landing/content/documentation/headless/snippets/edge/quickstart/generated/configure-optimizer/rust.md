```rust
use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .payload_memory(Memory::Cold)
    .vector(
        VECTOR_NAME,
        EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, Distance::Cosine)
            .memory(Memory::Cold)
            .build(),
    )
    .optimizers(EdgeOptimizersConfig {
        deleted_threshold: Some(0.2),
        vacuum_min_vector_number: Some(100),
        default_segment_number: Some(2),
        ..Default::default()
    })
    .build();
```
