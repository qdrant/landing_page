```rust
use std::path::Path;

use qdrant_edge::bm25_embed::{EdgeBm25, EdgeBm25Config};
use qdrant_edge::external::serde_json::json;
use qdrant_edge::{
    EdgeConfigBuilder, EdgeShard, EdgeSparseVectorParamsBuilder, Modifier,
    NamedQuery, PointInsertOperations, PointOperations, PointStruct,
    QueryEnum, QueryRequest, ScoringQuery, UpdateOperation,
    VectorInternal, Vectors, WithPayloadInterface, WithVector,
};

const SHARD_DIRECTORY: &str = "./qdrant-edge-bm25";

let config = EdgeConfigBuilder::new()
    .sparse_vector("text", EdgeSparseVectorParamsBuilder::new()
        .modifier(Modifier::Idf)
        .build())
    .build();

let shard = EdgeShard::new(Path::new(SHARD_DIRECTORY), config)?;
```
