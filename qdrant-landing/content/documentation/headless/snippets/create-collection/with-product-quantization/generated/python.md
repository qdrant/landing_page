```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    quantization_config=models.ProductQuantization(
        product=models.ProductQuantizationConfig(
            compression=models.CompressionRatio.X16,
            always_ram=True,
        ),
    ),
)
```
