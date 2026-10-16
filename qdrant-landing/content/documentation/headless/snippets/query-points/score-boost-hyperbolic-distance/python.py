from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

geodesic = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[-3.2, 0.3, 0.4],  # <-- the time coordinate (the first value) is negated
        limit=100
    ),
    query=models.FormulaQuery(
        formula=models.MultExpression(mult=[
            -3.1622776601683795,  # -1 / sqrt(0.1)
            models.AcoshExpression(
                acosh=models.MultExpression(mult=[
                    0.1,
                    models.NegExpression(neg="$score")
                ])
            )
        ])
    )
)
