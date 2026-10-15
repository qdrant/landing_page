from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")  # @hide

best_fields = client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=models.Document(text="vector database", model="qdrant/bm25"),
            using="title-bm25",
            limit=50,
        ),
        models.Prefetch(
            query=models.Document(text="vector database", model="qdrant/bm25"),
            using="body-bm25",
            limit=50,
        ),
    ],
    query=models.FormulaQuery(
        formula=models.MaxExpression(max=[
            models.MultExpression(mult=[3.0, "$score[0]"]),  # boost title matches
            "$score[1]",
        ])
    )
)
