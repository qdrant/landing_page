```rust
use std::collections::HashMap;
use std::path::Path;

use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, PointStruct, UpsertPointsBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;
use qdrant_edge::EdgeShard;
use qdrant_edge::internal::SnapshotManifest;
use qdrant_edge::{
    EdgeConfigBuilder, EdgeVectorParamsBuilder, PointId, PointInsertOperations,
    PointOperations, PointStruct as EdgePoint, PointStructPersisted,
    UpdateOperation, Vectors,
};
use serde_json::json;

const COLLECTION_NAME: &str = "edge-collection";

let snapshot_url = format!(
    "{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"
);

const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";
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
```
