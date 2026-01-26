```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.create_collection(
    collection_name="books",
    sparse_vectors_config={
        "title-bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)
    },
)
```
