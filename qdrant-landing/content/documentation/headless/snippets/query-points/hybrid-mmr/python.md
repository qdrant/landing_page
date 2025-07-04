```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.01, 0.45, 0.67],  # <-- search vector
        limit=100,
    ),
    query=models.MmrQuery(
        mmr=models.MmrInput(
            vector=[0.01, 0.45, 0.67],  # <-- same vector
            lambda_=0.5,
        )
    ),
)
```
