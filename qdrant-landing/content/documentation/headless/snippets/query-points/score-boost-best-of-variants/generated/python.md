```python
from qdrant_client import QdrantClient, models

best_fields = client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=models.TextQuery(text="vector database"),
            using="title",
            limit=50,
        ),
        models.Prefetch(
            query=models.TextQuery(text="vector database"),
            using="body",
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
```
