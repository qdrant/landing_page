```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://qdrant-node-2:6333")

client.recover_snapshot(
    "{collection_name}",
    "http://qdrant-node-1:6333/collections/{collection_name}/snapshots/snapshot-2022-10-10.shapshot",
    priority=models.SnapshotPriority.SNAPSHOT,
)
```
