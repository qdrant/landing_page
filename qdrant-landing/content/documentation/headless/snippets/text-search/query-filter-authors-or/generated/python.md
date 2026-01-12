```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.query_points(
    collection_name="books",
    query=models.Document(text="space opera", model="sentence-transformers/all-minilm-l6-v2"),
    using="description-dense",
    with_payload=True,
    query_filter=models.Filter(
        should=[
            models.FieldCondition(key="author", match=models.MatchValue(value="Larry Niven")),
            models.FieldCondition(key="author", match=models.MatchValue(value="Jerry Pournelle")),
        ]
    ),
)
```
