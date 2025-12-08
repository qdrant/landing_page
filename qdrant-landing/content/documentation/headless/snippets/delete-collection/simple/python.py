from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.delete_collection(collection_name="{collection_name}")
