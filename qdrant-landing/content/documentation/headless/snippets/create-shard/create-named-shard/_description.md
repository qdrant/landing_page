This code snippet creates a named shard in a Qdrant collection.
Collection is required to be configured with `custom` sharding method to support named shards.
Once created, named shard will receive all requests that specify its name in the shard key selector.

If no named shard is specified in the request, request will be broadcasted to all shards in the collection.
