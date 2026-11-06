```bash
curl -X PUT 'http://{qdrant-url}:6333/collections/{collection_name}/shards/{shard_id}/snapshots/recover' \
    -H 'api-key: ********' \
    -H 'Content-Type: application/json' \
    -d '{
  "location": "http://qdrant-node-1:6333/collections/{collection_name}/shards/{shard_id}/snapshots/{snapshot_name}",
  "priority": "snapshot"
}'
```
