```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.01, 0.45, 0.67],  # <-- dense vector
        using="dense",
        limit=100,
    ),
    query=models.TextQuery(text="time travel"),
    using="title",
    limit=10,
)
```
