```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    "xyz-example.cloud-region.cloud-provider.cloud.qdrant.io",
    api_key="<paste-your-api-key-here>",
    cloud_inference=True,
    timeout=30.0
)
```
