```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.StrictModeConfig(enabled=True, max_collection_vector_size_bytes=1000000, max_collection_payload_size_bytes=1000000),
)
```
