```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="city",
                match=models.MatchValue(value="London"),
            ),
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ]
    ),
)
```
