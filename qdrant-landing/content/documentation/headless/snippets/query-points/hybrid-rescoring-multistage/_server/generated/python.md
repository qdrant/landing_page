```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        prefetch=models.Prefetch(
            query=[1, 23, 45, 67],  # <------ small byte vector
            using="mrl_byte",
            limit=1000,
        ),
        query=[0.01, 0.45, 0.67],  # <-- full dense vector
        using="full",
        limit=100,
    ),
    query=[
        [0.17, 0.23, 0.52],  # <─┐
        [0.22, 0.11, 0.63],  # < ├─ multi-vector
        [0.86, 0.93, 0.12],  # < ┘
    ],
    using="colbert",
    limit=10,
)
```
