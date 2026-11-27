```python
from qdrant_client import QdrantClient, models

client.create_collection(
    collection_name="venues",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
)
```
