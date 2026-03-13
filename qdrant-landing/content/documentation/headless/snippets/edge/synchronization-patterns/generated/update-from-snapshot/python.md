```python
manifest = edge_shard.snapshot_manifest()

url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot/partial/create"

with tempfile.TemporaryDirectory(dir=data_dir) as temp_dir:
    partial_snapshot_path = Path(temp_dir) / "partial.snapshot"
    response = requests.post(url, headers={"api-key": QDRANT_API_KEY}, json=manifest, stream=True)
    response.raise_for_status()

    with open(partial_snapshot_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    edge_shard.update_from_snapshot(str(partial_snapshot_path))
```
