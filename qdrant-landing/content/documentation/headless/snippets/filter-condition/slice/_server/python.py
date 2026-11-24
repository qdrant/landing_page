from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.SliceCondition(slice=models.Slice(index=3, total=8)),
        ],
    ),
)
