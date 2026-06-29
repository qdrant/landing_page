// @block-start restore-snapshot
pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    const QDRANT_URL: &str = "";
    const QDRANT_API_KEY: &str = "";
    // @hide-end

    const COLLECTION_NAME: &str = "edge-collection";
    const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";

    use std::path::*;
    use qdrant_edge::*;

    let snapshot_url = format!(
        "{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"
    );

    let data_dir = Path::new(SHARD_DIRECTORY);

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

    let edge_shard = EdgeShard::load(data_dir, None)?;
    // @block-end restore-snapshot

    // @block-start update-from-snapshot
    use qdrant_edge::*;
    use qdrant_edge::internal::*;

    let current_manifest = edge_shard.snapshot_manifest()?;

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

    let edge_shard = EdgeShard::recover_partial_snapshot(
        data_dir,
        &current_manifest,
        unpacked_dir.path(),
        &snapshot_manifest,
    )?;
    // @block-end update-from-snapshot

    // @block-start initialize-edge-shard
    use std::path::*;
    use qdrant_edge::*;

    const VECTOR_DIMENSION: usize = 4;
    const VECTOR_NAME: &str = "my-vector";

    fs_err::create_dir_all(SHARD_DIRECTORY)?;
    let config = EdgeConfigBuilder::new()
        .on_disk_payload(true)
        .vector(
            VECTOR_NAME,
            EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, qdrant_edge::Distance::Cosine)
                .on_disk(true)
                .build(),
        )
        .build();

    let edge_shard = EdgeShard::new(
        Path::new(SHARD_DIRECTORY),
        config,
    )?;
    // @block-end initialize-edge-shard

    // @block-start initialize-server-client
    use ::qdrant_client::*;
    use ::qdrant_client::qdrant::*;
    use ::qdrant_client::qdrant::Distance;

    let server_client = Qdrant::from_url(QDRANT_URL)
        .api_key(QDRANT_API_KEY)
        .build()?;

    if !server_client.collection_exists(COLLECTION_NAME).await? {
        server_client
            .create_collection(
                CreateCollectionBuilder::new(COLLECTION_NAME).vectors_config(
                    VectorParamsBuilder::new(
                        VECTOR_DIMENSION as u64,
                        Distance::Cosine,
                    ),
                ),
            )
            .await?;
    }
    // @block-end initialize-server-client

    // @block-start create-upload-queue
    use std::collections::*;

    // This is an in-memory queue.
    // For production use cases consider persisting changes.
    let mut upload_queue: VecDeque<::qdrant_client::qdrant::PointStruct> = VecDeque::new();
    // @block-end create-upload-queue

    // @block-start upsert-point
    use std::collections::*;
    use serde_json::json;
    use qdrant_edge::{
        PointInsertOperations, PointOperations,
        PointStructPersisted, PointId, UpdateOperation, Vectors,
    };

    let id = 1u64;
    let vector = vec![0.1f32, 0.2, 0.3, 0.4];
    let payload = json!({"color": "red"});

    let edge_points: Vec<PointStructPersisted> = vec![
        qdrant_edge::PointStruct::new(
            PointId::NumId(id),
            Vectors::new_named([(VECTOR_NAME, vector.clone())]),
            payload.clone(),
        )
        .into(),
    ];
    edge_shard.update(UpdateOperation::PointOperation(
        PointOperations::UpsertPoints(
            PointInsertOperations::PointsList(edge_points),
        ),
    ))?;

    let server_point = ::qdrant_client::qdrant::PointStruct::new(
        id,
        HashMap::from([(VECTOR_NAME.to_string(), vector)]),
        payload.as_object().cloned().unwrap_or_default(),
    );
    upload_queue.push_back(server_point);
    // @block-end upsert-point

    // @block-start process-upload-queue
    use ::qdrant_client::qdrant::*;

    const BATCH_SIZE: usize = 10;
    let points_to_upload: Vec<::qdrant_client::qdrant::PointStruct> = upload_queue
        .drain(..BATCH_SIZE.min(upload_queue.len()))
        .collect();

    if !points_to_upload.is_empty() {
        server_client
            .upsert_points(UpsertPointsBuilder::new(
                COLLECTION_NAME,
                points_to_upload,
            ))
            .await?;
    }
    // @block-end process-upload-queue

    Ok(())
}
