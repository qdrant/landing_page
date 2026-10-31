curl 'http://{qdrant-url}:6333/collections/{collection_name}/shards/{shard_id}/snapshot' \
    -H 'api-key: ********' \
    --output 'filename.snapshot'
