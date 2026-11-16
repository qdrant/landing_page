```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="books",
    query=models.TextQuery(
        text=models.TextQueryInput(
            query="time travel",
            scoring=models.Bm25Scoring(
                bm25=models.Bm25Params(k=1.5, b=0.5),
            ),
        ),
    ),
    using="title",
    limit=10,
    with_payload=True,
)
```
