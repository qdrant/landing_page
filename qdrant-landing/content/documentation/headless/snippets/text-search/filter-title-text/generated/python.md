```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="books",
    query=models.Document(text="space opera", model="sentence-transformers/all-minilm-l6-v2"),
    using="description-dense",
    with_payload=True,
    query_filter=models.Filter(
        must=[models.FieldCondition(key="title", match=models.MatchText(text="space"))]
    ),
)
```
