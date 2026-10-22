```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="books",
    query=models.TextQuery(text="time travel"),
    using="title",
    limit=10,
    with_payload=True,
)
```
