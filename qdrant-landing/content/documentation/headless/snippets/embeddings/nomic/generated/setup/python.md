```python
from nomic import embed
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

MODEL = "nomic-embed-text-v1.5"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)
```
