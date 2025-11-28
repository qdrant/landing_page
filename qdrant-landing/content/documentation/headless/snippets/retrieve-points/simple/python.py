from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.retrieve(
    collection_name="{collection_name}",
    ids=[0, 3, 100],
)
