```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        # 2+ prefetches here
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
)
```
