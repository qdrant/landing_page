```python
from qdrant_client import QdrantClient, models

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={
        "dense_vector": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
        )
    },
    sparse_vectors_config={
        "bm25_sparse_vector": models.SparseVectorParams(
            modifier=models.Modifier.IDF # Enable Inverse Document Frequency
        )
    }
)
```
