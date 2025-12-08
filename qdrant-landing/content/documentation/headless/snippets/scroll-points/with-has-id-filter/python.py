from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.HasIdCondition(has_id=[1, 3, 5, 7, 9, 11]),
        ],
    ),
)
