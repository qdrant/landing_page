```python
from qdrant_client.serverless.models import (
    DenseVectorConfig,
    Distance,
    SparseVectorConfig,
)

client.create_collection(
    "menu",
    dense_vectors={"dense": DenseVectorConfig(size=384, distance=Distance.COSINE)},
    sparse_vectors={"bm25": SparseVectorConfig(use_idf=True)},
)
```
