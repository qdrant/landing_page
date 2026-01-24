```python
from qdrant_client import QdrantClient
from google.colab import userdata

client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"), cloud_inference=True)
```