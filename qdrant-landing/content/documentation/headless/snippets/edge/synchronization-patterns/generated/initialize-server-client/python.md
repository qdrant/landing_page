```python
from qdrant_client import QdrantClient, models

server_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

COLLECTION_NAME="edge-collection"

if not server_client.collection_exists(collection_name=COLLECTION_NAME):

    server_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={VECTOR_NAME: models.VectorParams(size=VECTOR_DIMENSION, distance=models.Distance.COSINE)}
    )
```
