from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.create_shard_key("{collection_name}", "default", shards_number=1)
