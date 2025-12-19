This code snippet creates a named shard with the name "user_1" in a Qdrant collection.
This shard is intended to be used as a dedicated shard for a specific tenant or user, allowing for better data isolation and management. Creation of the shard specifies initial state as `Partial`, as it needs to be populated with data before it can serve requests.

Collection is required to be configured with `custom` sharding method to support named shards.
Once created, named shard will receive all requests that specify its name in the shard key selector.
