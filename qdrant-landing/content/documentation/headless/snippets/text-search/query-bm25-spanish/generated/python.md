```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="books",
    query=models.Document(text="tiempo", model="qdrant/bm25", options={"language": "spanish"}),
    using="title-bm25",
    limit=10,
    with_payload=True,
)
```
