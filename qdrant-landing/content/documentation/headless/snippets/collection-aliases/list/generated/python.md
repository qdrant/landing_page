```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.get_collection_aliases(collection_name="{collection_name}")
```
