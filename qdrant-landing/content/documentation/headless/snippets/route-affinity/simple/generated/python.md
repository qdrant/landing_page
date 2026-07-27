```python
from qdrant_client import QdrantClient
from qdrant_client.context_headers import headers

with headers({"X-Qdrant-Route-Affinity": "user-42"}):
    client.query_points(
        collection_name="{collection_name}",
        query=[0.2, 0.1, 0.9, 0.7],
        limit=3,
    )
```
