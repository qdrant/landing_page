from qdrant_client import QdrantClient

# @hide-start
client = QdrantClient(url="http://localhost:6333")
# @hide-end

client.list_shard_keys(
    collection_name="{collection_name}",
)
