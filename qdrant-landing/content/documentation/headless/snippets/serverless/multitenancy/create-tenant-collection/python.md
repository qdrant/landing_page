```python
from qdrant_client.serverless.models import DenseVectorConfig, Distance

tenant_id = "acme"

client.create_collection(
    f"tenant-{tenant_id}",
    dense_vectors=DenseVectorConfig(size=384, distance=Distance.COSINE),
)
```
