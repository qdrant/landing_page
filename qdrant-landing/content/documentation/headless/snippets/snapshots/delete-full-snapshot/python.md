```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.delete_full_snapshot(snapshot_name="{snapshot_name}")
```
