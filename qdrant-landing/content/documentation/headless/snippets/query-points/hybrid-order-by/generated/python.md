```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.01, 0.45, 0.67],  # <-- dense vector
        filter=models.Filter(
            must=models.FieldCondition(
                key="price",
                range=models.Range(gte=10, lte=80),
            ),
        ),
        limit=100,  # <-- candidates that compete for the top spots
    ),
    query=models.OrderByQuery(
        order_by=models.OrderBy(key="price", direction=models.Direction.ASC)
    ),
    limit=10,
    with_payload=True,
)
```
