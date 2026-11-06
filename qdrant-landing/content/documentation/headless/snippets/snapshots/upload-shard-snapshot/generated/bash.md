```bash
curl -X POST 'http://{qdrant-url}:6333/collections/{collection_name}/shards/{shard_id}/snapshots/upload?priority=snapshot' \
    -H 'api-key: ********' \
    -H 'Content-Type:multipart/form-data' \
    -F 'snapshot=@/path/to/snapshot.snapshot'
```
