from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.delete_payload(
    collection_name="{collection_name}",
    keys=["color", "price"],
    points=models.Filter(
        must=[
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ],
    ),
)
