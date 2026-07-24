```python
from qdrant_client import QdrantClient, models

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            quantile=0.99,
            memory=models.Memory.PINNED,
        ),
    ),
)
```
