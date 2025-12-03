from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.facet(
    collection_name="{collection_name}",
    key="size",
    facet_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            )
        ]
    ),
)
