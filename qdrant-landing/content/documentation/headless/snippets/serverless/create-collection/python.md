```python
from qdrant_client.serverless.models import (
    DenseVectorConfig,
    Distance,
    FloatIndex,
    KeywordIndex,
    PrecisionTier,
    SparseVectorConfig,
)

client.create_collection(
    "products",
    dense_vectors={
        "dense": DenseVectorConfig(
            size=1536,
            distance=Distance.COSINE,
            precision_tier=PrecisionTier.MEDIUM,
        )
    },
    sparse_vectors={"bm25": SparseVectorConfig(use_idf=True)},
    payload_indexes={
        "category": KeywordIndex(),
        "price": FloatIndex(),
    },
)
```
