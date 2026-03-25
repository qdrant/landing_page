```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="{collection_name}",
    query=models.Document(
        text="My Query Text",
        model="<the-model-to-use>",
    ),
)
```
