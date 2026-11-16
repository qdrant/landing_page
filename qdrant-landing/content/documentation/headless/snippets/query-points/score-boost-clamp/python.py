from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

clamped = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.1, 0.45, 0.67],  # <-- dense vector
        limit=50
    ),
    query=models.FormulaQuery(
        formula=models.SumExpression(sum=[
            "$score",
            # clamp `rating` into the range [0, 1]
            models.MaxExpression(max=[
                0.0,
                models.MinExpression(min=[1.0, "rating"])
            ])
        ])
    )
)
