```python
from qdrant_client import QdrantClient, models

# Replace url and api_key with your own from https://cloud.qdrant.io
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True
)
```
