```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.delete_snapshot(
    collection_name="{collection_name}", snapshot_name="{snapshot_name}"
)
```
