```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client.create_collection(
    collection_name="items",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)
```
