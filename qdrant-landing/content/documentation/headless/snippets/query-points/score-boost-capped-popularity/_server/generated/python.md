```python
from qdrant_client import QdrantClient, models

capped_boost = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.1, 0.45, 0.67],  # <-- dense vector
        limit=50
    ),
    query=models.FormulaQuery(
        formula=models.SumExpression(sum=[
            "$score",
            models.MinExpression(min=[
                2.0,  # the boost can't exceed this value
                models.MultExpression(mult=[0.1, "log_views"])
            ])
        ])
    )
)
```
