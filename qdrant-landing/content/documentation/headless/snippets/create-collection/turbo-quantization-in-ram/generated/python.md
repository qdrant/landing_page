```python
from qdrant_client import QdrantClient, models

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=768,
        distance=models.Distance.COSINE,
        memory=models.Memory.COLD,
        datatype=models.Datatype.TURBO4,
    ),
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            bits=models.TurboQuantBitSize.BITS1,
            memory=models.Memory.PINNED,
        ),
    ),
)
```
