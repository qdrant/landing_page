```python
from qdrant_client import QdrantClient
from qdrant_client.context_headers import headers

with headers({"x-request-id": "my-trace-id"}):
    client.get_collections()
```
