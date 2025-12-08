from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.NestedCondition(
                nested=models.Nested(
                    key="diet",
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="food", match=models.MatchValue(value="meat")
                            ),
                            models.FieldCondition(
                                key="likes", match=models.MatchValue(value=True)
                            ),
                        ]
                    ),
                )
            )
        ],
    ),
)
