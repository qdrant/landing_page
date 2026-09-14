```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.01, 0.45, 0.67, 0.53],  # <-- dense vector
        limit=100,
    ),
    query=[
        [0.1, 0.2, 0.32],  # <─┐
        [0.2, 0.1, 0.52],  # < ├─ multi-vector
        [0.8, 0.9, 0.93],  # < ┘
    ],
    using="colbert",
    limit=10,
)
```
