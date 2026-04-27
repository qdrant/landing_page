```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)
```
