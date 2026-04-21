from qdrant_client import QdrantClient, headers  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

with headers({"x-request-id": "my-trace-id"}):
    client.get_collections()
