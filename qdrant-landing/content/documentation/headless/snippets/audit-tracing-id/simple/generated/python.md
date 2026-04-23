```python
from qdrant_client import QdrantClient, headers

with headers({"x-request-id": "my-trace-id"}):
    client.get_collections()
```
