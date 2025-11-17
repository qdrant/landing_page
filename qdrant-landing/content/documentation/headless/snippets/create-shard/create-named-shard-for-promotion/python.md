```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_shard_key(
    "{collection_name}",
    shard_key="user_1",
    initial_state=models.ReplicaState.PARTIAL
)
```