```rust
use std::collections::HashMap;
use std::path::Path;

use edge::EdgeShard;
use edge::segment::data_types::vectors::{NamedQuery, VectorInternal, VectorStructInternal};
use edge::segment::types::{
    Distance, ExtendedPointId, Payload, PayloadStorageType, SegmentConfig, VectorDataConfig,
    VectorStorageType, WithPayloadInterface, WithVector,
};
use serde_json::{Value, json};
use edge::shard::operations::CollectionUpdateOperations::PointOperation;
use edge::shard::operations::point_ops::PointInsertOperationsInternal::PointsList;
use edge::shard::operations::point_ops::PointOperations::UpsertPoints;
use edge::shard::operations::point_ops::PointStructPersisted;
use edge::shard::query::query_enum::QueryEnum;
use edge::shard::query::{ScoringQuery, ShardQueryRequest};

const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";

fs_err::create_dir_all(SHARD_DIRECTORY)?;

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

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), Some(config))?;

fn point(id: u64, vector: Vec<f32>, payload: Value) -> PointStructPersisted {
    let mut vectors = HashMap::new();
    vectors.insert(VECTOR_NAME.to_string(), VectorInternal::from(vector));
    PointStructPersisted {
        id: ExtendedPointId::NumId(id),
        vector: VectorStructInternal::Named(vectors).into(),
        payload: Some(json_to_payload(payload)),
    }
}

fn json_to_payload(value: Value) -> Payload {
    if let Value::Object(map) = value {
        let mut payload = Payload::default();
        for (k, v) in map {
            payload.0.insert(k, v);
        }
        payload
    } else {
        Payload::default()
    }
}

let points = vec![point(1, vec![0.1, 0.2, 0.3, 0.4], json!({"color": "red"}))];

edge_shard.update(PointOperation(UpsertPoints(PointsList(points))))?;

let retrieved = edge_shard.retrieve(
    &[ExtendedPointId::NumId(1)],
    Some(WithPayloadInterface::Bool(true)),
    Some(WithVector::Bool(false)),
)?;

let results = edge_shard.query(ShardQueryRequest {
    prefetches: vec![],
    query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
        query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
        using: Some(VECTOR_NAME.to_string()),
    }))),
    filter: None,
    score_threshold: None,
    limit: 10,
    offset: 0,
    params: None,
    with_vector: WithVector::Bool(false),
    with_payload: WithPayloadInterface::Bool(true),
})?;

drop(edge_shard);

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), None)?;
```
