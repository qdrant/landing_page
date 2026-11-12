from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

geodesic = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[-1.118, 0.3, 0.4],  # <-- the sign of the first element is flipped
        limit=100
    ),
    query=models.FormulaQuery(
        formula=models.NegExpression(
            neg=models.AcoshExpression(
                acosh=models.NegExpression(neg="$score")
            )
        )
    )
)
