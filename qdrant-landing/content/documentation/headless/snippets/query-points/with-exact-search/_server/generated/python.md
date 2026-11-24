```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
    search_params=models.SearchParams(exact=True),
    limit=10,
)
```
