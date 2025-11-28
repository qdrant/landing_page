from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.clear_payload(
    collection_name="{collection_name}",
    points_selector=[0, 3, 100],
)
