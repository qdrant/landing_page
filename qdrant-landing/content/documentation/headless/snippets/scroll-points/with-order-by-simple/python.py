from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.scroll(
    collection_name="{collection_name}",
    limit=15,
    order_by="timestamp", # <-- this!
)
