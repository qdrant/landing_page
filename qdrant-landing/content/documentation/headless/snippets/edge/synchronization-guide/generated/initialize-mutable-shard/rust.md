```rust
use std::collections::HashMap;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use ordered_float::OrderedFloat;
use qdrant_client::qdrant::PointStruct;
use qdrant_edge::EdgeShard;
use qdrant_edge::internal::SnapshotManifest;
use qdrant_edge::{
    Condition, Distance, EdgeConfigBuilder, EdgeVectorParamsBuilder,
    FieldCondition, Filter, JsonPath, NamedQuery, PointId, PointInsertOperations,
    PointOperations, PointStruct as EdgePoint, PointStructPersisted, QueryEnum,
    QueryRequest, Range, ScoringQuery, UpdateOperation, Vectors,
    WithPayloadInterface, WithVector,
};
use serde_json::json;

const MUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/mutable";
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(MUTABLE_SHARD_DIR)?;
let config = EdgeConfigBuilder::new()
    .on_disk_payload(true)
    .vector(
        VECTOR_NAME,
        EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, Distance::Cosine)
            .on_disk(true)
            .build(),
    )
    .build();

let mutable_shard = EdgeShard::new(
    Path::new(MUTABLE_SHARD_DIR),
    config,
)?;
```
