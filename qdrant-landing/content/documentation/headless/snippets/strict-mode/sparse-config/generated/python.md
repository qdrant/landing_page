```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.StrictModeConfig(
        enabled=True,
        sparse_config={"{vector_name}": models.StrictModeSparse(max_length=1000)},
    ),
)
```
