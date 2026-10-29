```rust
use qdrant_edge::*;

const VECTOR_NAME: &str = "my-vector";
const VECTOR_DIMENSION: usize = 4;

let config = EdgeConfigBuilder::new()
    .payload_memory(Memory::Cold)
    .vector(
        VECTOR_NAME,
        EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, Distance::Cosine)
            .memory(Memory::Cold)
            .build(),
    )
    .build();
```
