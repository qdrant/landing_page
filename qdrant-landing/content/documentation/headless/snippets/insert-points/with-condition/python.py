from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector=[0.05, 0.61, 0.76, 0.74],
            payload={
                "city": "Berlin",
                "price": 1.99,
                "version": 3,
            },
        ),
    ],
    update_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="version",
                match=models.MatchValue(value=2),
            ),
        ],
    ),
)
