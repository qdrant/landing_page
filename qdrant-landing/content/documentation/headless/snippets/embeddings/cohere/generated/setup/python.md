```python
import cohere
from qdrant_client import QdrantClient, models

co = cohere.ClientV2()
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=2048, distance=models.Distance.COSINE),
)
```
