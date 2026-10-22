```rust
use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .vector(
        "my-vector",
        EdgeVectorParamsBuilder::new(1024, Distance::Cosine)
            .datatype(VectorStorageDatatype::Turbo16)
            .build(),
    )
    .build();

let _edge_shard = EdgeShard::new(std::path::Path::new("./shard"), config)?;
```
