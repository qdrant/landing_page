```python
from qdrant_client import QdrantClient, models

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=768, distance=models.Distance.COSINE, memory=models.Memory.COLD
    ),
    quantization_config=models.BinaryQuantization(
        binary=models.BinaryQuantizationConfig(memory=models.Memory.COLD),
    ),
    hnsw_config=models.HnswConfigDiff(memory=models.Memory.COLD, inline_storage=True),
)
```
