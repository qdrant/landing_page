from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.query_points(
    collection_name="{collection_name}",
    query="43cf51e2-8777-4f52-bc74-c2cbde0c8b04", # <--- point id
)
