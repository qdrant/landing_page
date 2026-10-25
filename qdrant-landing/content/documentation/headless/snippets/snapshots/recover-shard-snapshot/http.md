```http
PUT /collections/{collection_name}/shards/{shard_id}/snapshots/recover
{
  "location": "http://qdrant-node-1:6333/collections/{collection_name}/shards/{shard_id}/snapshots/{snapshot_name}",
  "priority": "snapshot"
}
```
