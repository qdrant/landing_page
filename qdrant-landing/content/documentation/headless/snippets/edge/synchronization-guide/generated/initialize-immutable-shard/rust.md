```rust
const COLLECTION_NAME: &str = "edge-collection";
let snapshot_url =
    format!("{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot");

const IMMUTABLE_SHARD_DIR: &str = "./qdrant-edge-directory/immutable";
let data_dir = Path::new(IMMUTABLE_SHARD_DIR);

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

let immutable_shard = EdgeShard::load(data_dir, None)?;
```
