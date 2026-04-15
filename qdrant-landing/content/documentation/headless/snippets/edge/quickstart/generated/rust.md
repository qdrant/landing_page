```rust
use std::collections::HashMap;
use std::path::Path;

use qdrant_edge::EdgeShard;
use qdrant_edge::{
    Condition, CreateIndex, Distance, EdgeConfig, EdgeOptimizersConfig,
    EdgeVectorParams, FacetRequest, FieldCondition, FieldIndexOperations,
    Filter, Match, MatchValue, NamedQuery, PayloadFieldSchema,
    PayloadSchemaType, PointId, PointInsertOperations, PointOperations,
    PointStruct, PointStructPersisted, QueryEnum, QueryRequest, ScoringQuery,
    UpdateOperation, ValueVariants, Vectors, WithPayloadInterface, WithVector,
};
use serde_json::json;

const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";

fs_err::create_dir_all(SHARD_DIRECTORY)?;

const VECTOR_NAME: &str = "my-vector";
const VECTOR_DIMENSION: usize = 4;

let config = EdgeConfig {
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
    optimizers: Default::default(),
};

let edge_shard = EdgeShard::new(
    Path::new(SHARD_DIRECTORY),
    config,
)?;

let points: Vec<PointStructPersisted> = vec![
    PointStruct::new(
        1u64,
        Vectors::new_named([(VECTOR_NAME, vec![0.1f32, 0.2, 0.3, 0.4])]),
        json!({"color": "red"}),
    )
    .into(),
];

edge_shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(
        PointInsertOperations::PointsList(points),
    ),
))?;

let retrieved = edge_shard.retrieve(
    &[PointId::NumId(1)],
    Some(WithPayloadInterface::Bool(true)),
    Some(WithVector::Bool(false)),
)?;

let results = edge_shard.query(QueryRequest {
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

let filter = Filter {
    should: None,
    min_should: None,
    must: Some(vec![Condition::Field(FieldCondition::new_match(
        "color".try_into().unwrap(),
        Match::Value(MatchValue {
            value: ValueVariants::String("red".to_string()),
        }),
    ))]),
    must_not: None,
};

let results = edge_shard.query(QueryRequest {
    prefetches: vec![],
    query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
        query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
        using: Some(VECTOR_NAME.to_string()),
    }))),
    filter: Some(filter),
    score_threshold: None,
    limit: 10,
    offset: 0,
    params: None,
    with_vector: WithVector::Bool(false),
    with_payload: WithPayloadInterface::Bool(true),
})?;

let facet_response = edge_shard.facet(FacetRequest {
    key: "color".try_into().unwrap(),
    limit: 10,
    filter: None,
    exact: false,
})?;

edge_shard.optimize()?;

let config = EdgeConfig {
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

edge_shard.update(UpdateOperation::FieldIndexOperation(
    FieldIndexOperations::CreateIndex(CreateIndex {
        field_name: "color".try_into().unwrap(),
        field_schema: Some(PayloadFieldSchema::FieldType(
            PayloadSchemaType::Keyword,
        )),
    }),
))?;

drop(edge_shard);

let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), None)?;
```
