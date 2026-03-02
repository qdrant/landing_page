```python
import requests
import tempfile
import shutil

COLLECTION_NAME="edge-collection"
snapshot_url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"

IMMUTABLE_SHARD_DIR = "./qdrant-edge-directory/mutable"
data_dir = Path(IMMUTABLE_SHARD_DIR)

with tempfile.TemporaryDirectory(dir=data_dir.parent) as restore_dir:
    snapshot_path = Path(restore_dir) / "shard.snapshot"

    with requests.get(snapshot_url, headers={"api-key": QDRANT_API_KEY}, stream=True) as r:
        r.raise_for_status()
        with open(snapshot_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    immutable_shard = None
    if data_dir.exists():
        shutil.rmtree(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    EdgeShard.unpack_snapshot(str(snapshot_path), str(data_dir))

immutable_shard = EdgeShard(IMMUTABLE_SHARD_DIR)
```
