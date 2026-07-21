from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.create_collection(
    collection_name="{collection_name}",
    shard_number=1,
    sharding_method=models.ShardingMethod.CUSTOM,
    # ... other collection parameters
)
