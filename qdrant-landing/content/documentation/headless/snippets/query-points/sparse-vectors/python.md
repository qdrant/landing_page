```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")


result = client.query_points(
    collection_name="{collection_name}",
    query=models.SparseVector(indices=[1, 3, 5, 7], values=[0.1, 0.2, 0.3, 0.4]),
    using="text",
).points
```
