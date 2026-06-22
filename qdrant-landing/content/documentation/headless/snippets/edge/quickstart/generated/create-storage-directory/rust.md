```rust
use std::path::Path;

use qdrant_edge::{
    Condition, CreateIndex, CreateVectorName, Distance, EdgeConfigBuilder, EdgeShard,
    EdgeOptimizersConfig, EdgeVectorParamsBuilder, FacetRequest, FieldCondition,
    FieldIndexOperations, Filter, Match, MatchValue, Modifier, NamedQuery,
    PayloadFieldSchema, PayloadSchemaType, PointId, PointInsertOperations,
    PointOperations, PointStruct, PointStructPersisted, QueryEnum, QueryRequest,
    ScoringQuery, SparseVectorConfig, UpdateOperation, ValueVariants,
    VectorNameConfig, VectorNameOperations, Vectors, WalOptions,
    WithPayloadInterface, WithVector,
};
use serde_json::json;

const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";

fs_err::create_dir_all(SHARD_DIRECTORY)?;
```
