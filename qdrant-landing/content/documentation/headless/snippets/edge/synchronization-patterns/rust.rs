use std::collections::HashMap;
use std::path::Path;

use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, PointStruct, UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;
use qdrant_edge::EdgeShard;
use qdrant_edge::config::shard::EdgeShardConfig;
use qdrant_edge::config::vectors::EdgeVectorParams;
use qdrant_edge::segment::data_types::vectors::{VectorInternal, VectorStructInternal};
use qdrant_edge::segment::types::{ExtendedPointId, Payload};
use qdrant_edge::shard::operations::CollectionUpdateOperations::PointOperation;
use qdrant_edge::shard::operations::point_ops::PointInsertOperationsInternal::PointsList;
use qdrant_edge::shard::operations::point_ops::PointOperations::UpsertPoints;
use qdrant_edge::shard::operations::point_ops::PointStructPersisted;
use qdrant_edge::shard::snapshots::snapshot_manifest::SnapshotManifest;
use serde_json::{Value, json};

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let QDRANT_URL = "";
    let QDRANT_API_KEY = "";
    // @hide-end

    // @block-start snapshot-url
    const COLLECTION_NAME: &str = "edge-collection";

    let snapshot_url =
        format!("{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot");
    // @block-end snapshot-url

    // @block-start restore-snapshot
    const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";
    let data_dir = Path::new(SHARD_DIRECTORY);

    let restore_dir =
        tempfile::Builder::new().tempdir_in(data_dir.parent().unwrap_or(Path::new(".")))?;
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

    let edge_shard = EdgeShard::load(data_dir, None)?;
    // @block-end restore-snapshot

    // @block-start update-from-snapshot
    let current_manifest = edge_shard.snapshot_manifest()?;

    let update_url = format!(
        "{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot/partial/create"
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
    let snapshot_manifest = SnapshotManifest::load_from_snapshot(unpacked_dir.path(), None)?;

    let edge_shard = EdgeShard::recover_partial_snapshot(
        data_dir,
        &current_manifest,
        unpacked_dir.path(),
        &snapshot_manifest,
    )?;
    // @block-end update-from-snapshot

    // @block-start initialize-edge-shard
    const VECTOR_DIMENSION: usize = 4;
    const VECTOR_NAME: &str = "my-vector";

    fs_err::create_dir_all(SHARD_DIRECTORY)?;
    let config = EdgeShardConfig {
        on_disk_payload: true,
        vectors: HashMap::from([(
            VECTOR_NAME.to_string(),
            EdgeVectorParams {
                size: VECTOR_DIMENSION,
                distance: qdrant_edge::segment::types::Distance::Cosine,
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

    let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), Some(config))?;
    // @block-end initialize-edge-shard

    // @block-start initialize-server-client
    let server_client = Qdrant::from_url(QDRANT_URL)
        .api_key(QDRANT_API_KEY)
        .build()?;

    if !server_client.collection_exists(COLLECTION_NAME).await? {
        server_client
            .create_collection(
                CreateCollectionBuilder::new(COLLECTION_NAME).vectors_config(
                    VectorParamsBuilder::new(VECTOR_DIMENSION as u64, Distance::Cosine),
                ),
            )
            .await?;
    }
    // @block-end initialize-server-client

    // @block-start create-upload-queue
    // This is an in-memory queue.
    // For production use cases consider persisting changes.
    let mut upload_queue: std::collections::VecDeque<PointStruct> =
        std::collections::VecDeque::new();
    // @block-end create-upload-queue

    // @block-start upsert-point
    let id = 1u64;
    let vector = vec![0.1f32, 0.2, 0.3, 0.4];
    let payload = json!({"color": "red"});

    fn edge_point(id: u64, vector: Vec<f32>, payload: Value) -> PointStructPersisted {
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

    edge_shard.update(PointOperation(UpsertPoints(PointsList(vec![edge_point(
        id,
        vector.clone(),
        payload.clone(),
    )]))))?;

    let server_point = PointStruct::new(
        id,
        HashMap::from([(VECTOR_NAME.to_string(), vector)]),
        payload.as_object().cloned().unwrap_or_default(),
    );
    upload_queue.push_back(server_point);
    // @block-end upsert-point

    // @block-start process-upload-queue
    const BATCH_SIZE: usize = 10;
    let points_to_upload: Vec<PointStruct> = upload_queue
        .drain(..BATCH_SIZE.min(upload_queue.len()))
        .collect();

    if !points_to_upload.is_empty() {
        server_client
            .upsert_points(UpsertPointsBuilder::new(COLLECTION_NAME, points_to_upload))
            .await?;
    }
    // @block-end process-upload-queue

    Ok(())
}
