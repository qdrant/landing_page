from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.delete_vectors(
    collection_name="{collection_name}",
    points=[0, 3, 100],
    vectors=["text", "image"],
)
