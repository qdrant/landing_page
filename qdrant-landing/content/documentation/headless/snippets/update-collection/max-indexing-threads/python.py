from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.update_collection(
    collection_name="{collection_name}",
    hnsw_config=models.HnswConfigDiff(max_indexing_threads=4),
)
