```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.StrictModeConfig(
        enabled=True,
        multivector_config={"{vector_name}": models.StrictModeMultivector(max_vectors=10)},
    ),
)
```
