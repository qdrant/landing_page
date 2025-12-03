from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must_not=[
            models.FieldCondition(key="city", match=models.MatchValue(value="London")),
            models.FieldCondition(key="color", match=models.MatchValue(value="red")),
        ]
    ),
)
