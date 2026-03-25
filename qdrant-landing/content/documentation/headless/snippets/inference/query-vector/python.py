from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.query_points(
    collection_name="{collection_name}",
    query=[0.12, 0.34, 0.56, 0.78],
)
