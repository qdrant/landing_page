curl 'http://{qdrant-url}:6333/collections/{collection_name}/shards/{shard_id}/snapshots/{snapshot_name}' \
    -H 'api-key: ********' \
    --output 'filename.snapshot'
