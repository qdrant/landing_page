from qdrant_client import QdrantClient
from qdrant_client.context_headers import headers

client = QdrantClient(url="http://localhost:6333")  # @hide

with headers({"x-request-id": "my-trace-id"}):
    client.get_collections()
