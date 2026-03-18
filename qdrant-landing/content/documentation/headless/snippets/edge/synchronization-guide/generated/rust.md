```rust
use std::collections::HashMap;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use ordered_float::OrderedFloat;
use qdrant_client::qdrant::PointStruct;
use qdrant_edge::EdgeShard;
use qdrant_edge::internal::SnapshotManifest;
use qdrant_edge::{
    Condition, Distance, EdgeConfig, EdgeVectorParams, FieldCondition, Filter,
    JsonPath, NamedQuery, PointId, PointInsertOperations, PointOperations,
    PointStruct as EdgePoint, PointStructPersisted, QueryEnum, QueryRequest,
    Range, ScoringQuery, UpdateOperation, Vectors, WithPayloadInterface,
    WithVector,
};
use serde_json::json;

const MUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/mutable";
const VECTOR_DIMENSION: usize = 4;
const VECTOR_NAME: &str = "my-vector";

fs_err::create_dir_all(MUTABLE_SHARD_DIR)?;
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

let mutable_shard = EdgeShard::load(
    Path::new(MUTABLE_SHARD_DIR),
    Some(config),
)?;

const COLLECTION_NAME: &str = "edge-collection";
let snapshot_url = format!(
    "{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"
);

const IMMUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/immutable";
let data_dir = Path::new(IMMUTABLE_SHARD_DIR);

let restore_dir = tempfile::Builder::new()
    .tempdir_in(data_dir.parent().unwrap_or(Path::new(".")))?;
let snapshot_path = restore_dir.path().join("shard.snapshot");

let mut bytes = Vec::new();
std::io::copy(
    &mut ureq::get(&snapshot_url)
        .header("api-key", QDRANT_API_KEY)
        .call()?
        .into_body()
        .into_reader(),
    &mut bytes,
)?;
fs_err::write(&snapshot_path, &bytes)?;

if data_dir.exists() {
    fs_err::remove_dir_all(data_dir)?;
}
fs_err::create_dir_all(data_dir)?;

EdgeShard::unpack_snapshot(&snapshot_path, data_dir)?;

let immutable_shard = EdgeShard::load(data_dir, None)?;

const SYNC_TIMESTAMP_KEY: &str = "timestamp";
let id = 2u64;
let vector = vec![0.4f32, 0.3, 0.2, 0.1];
let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs_f64();
let payload = json!({
    "color": "green",
    SYNC_TIMESTAMP_KEY: timestamp,
});

let edge_points: Vec<PointStructPersisted> = vec![
    EdgePoint::new(
        PointId::NumId(id),
        Vectors::new_named([(VECTOR_NAME, vector.clone())]),
        payload.clone(),
    )
    .into(),
];
mutable_shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(
        PointInsertOperations::PointsList(edge_points),
    ),
))?;

let rest_point = PointStruct::new(
    id,
    HashMap::from([(VECTOR_NAME.to_string(), vector)]),
    payload.as_object().cloned().unwrap_or_default(),
);
upload_queue.push_back(rest_point);

let sync_timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs_f64();

let current_manifest = immutable_shard.snapshot_manifest()?;

let update_url = format!(
    "{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot\
    /partial/create"
);

let temp_dir = tempfile::tempdir_in(data_dir)?;
let partial_snapshot_path = temp_dir.path().join("partial.snapshot");

let mut bytes = Vec::new();
std::io::copy(
    &mut ureq::post(&update_url)
        .header("api-key", QDRANT_API_KEY)
        .send_json(&current_manifest)?
        .into_body()
        .into_reader(),
    &mut bytes,
)?;
fs_err::write(&partial_snapshot_path, &bytes)?;

let unpacked_dir = tempfile::tempdir_in(data_dir)?;
EdgeShard::unpack_snapshot(&partial_snapshot_path, unpacked_dir.path())?;
let snapshot_manifest = SnapshotManifest::load_from_snapshot(
    unpacked_dir.path(),
    None,
)?;

let immutable_shard = EdgeShard::recover_partial_snapshot(
    data_dir,
    &current_manifest,
    unpacked_dir.path(),
    &snapshot_manifest,
)?;

let filter = Filter::new_must(Condition::Field(FieldCondition::new_range(
    SYNC_TIMESTAMP_KEY.parse::<JsonPath>().unwrap(),
    Range {
        lte: Some(OrderedFloat(sync_timestamp)),
        ..Default::default()
    },
)));

mutable_shard.update(UpdateOperation::PointOperation(
    PointOperations::DeletePointsByFilter(filter),
))?;

let query = QueryRequest {
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
};

let mut all_results = mutable_shard.query(query.clone())?;
all_results.extend(immutable_shard.query(query)?);

all_results.sort_by(|a, b| {
    b.score
        .partial_cmp(&a.score)
        .unwrap_or(std::cmp::Ordering::Equal)
});

let mut seen_ids = std::collections::HashSet::new();
let results: Vec<_> = all_results
    .into_iter()
    .filter(|p| seen_ids.insert(p.id.clone()))
    .take(10)
    .collect();
```
