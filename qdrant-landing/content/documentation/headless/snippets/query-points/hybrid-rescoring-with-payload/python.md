```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=[0.01, 0.45, 0.67],  # <-- dense vector
            filter=models.Filter(
                must=models.FieldCondition(
                    key="color",
                    match=models.MatchValue(value="red"),
                ),
            ),
            limit=10,
        ),
        models.Prefetch(
            query=[0.01, 0.45, 0.67],  # <-- dense vector
            filter=models.Filter(
                must=models.FieldCondition(
                    key="color",
                    match=models.MatchValue(value="green"),
                ),
            ),
            limit=10,
        ),
    ],
    query=models.OrderByQuery(order_by="price"),
)
```
