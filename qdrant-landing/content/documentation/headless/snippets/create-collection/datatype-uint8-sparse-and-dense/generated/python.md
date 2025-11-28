```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=128, distance=models.Distance.COSINE, datatype=models.Datatype.UINT8
    ),
    sparse_vectors_config={
        "text": models.SparseVectorParams(
            index=models.SparseIndexParams(datatype=models.Datatype.UINT8)
        ),
    },
)
```
