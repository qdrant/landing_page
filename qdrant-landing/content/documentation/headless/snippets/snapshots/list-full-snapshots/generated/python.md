```python
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)

client.list_full_snapshots()
```
