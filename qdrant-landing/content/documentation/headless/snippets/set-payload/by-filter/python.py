from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.set_payload(
    collection_name="{collection_name}",
    payload={
        "property1": "string",
        "property2": "string",
    },
    points=models.Filter(
        must=[
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ],
    ),
)
