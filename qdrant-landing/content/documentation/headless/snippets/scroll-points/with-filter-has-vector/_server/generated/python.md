```python
from qdrant_client import QdrantClient, models

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.HasVectorCondition(has_vector="image"),
        ],
    ),
)
```
