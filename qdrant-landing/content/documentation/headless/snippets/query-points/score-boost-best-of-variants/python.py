from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

best_match = client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(query=[0.1, 0.45, 0.67], using="title", limit=50),
        models.Prefetch(query=[0.1, 0.45, 0.67], using="summary", limit=50),
    ],
    query=models.FormulaQuery(
        formula=models.MaxExpression(max=["$score[0]", "$score[1]"])
    )
)
