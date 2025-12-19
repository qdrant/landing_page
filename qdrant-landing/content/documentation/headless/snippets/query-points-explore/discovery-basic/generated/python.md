```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

discover_queries = [
    models.QueryRequest(
        query=models.DiscoverQuery(
            discover=models.DiscoverInput(
                target=[0.2, 0.1, 0.9, 0.7],
                context=[
                    models.ContextPair(
                        positive=100,
                        negative=718,
                    ),
                    models.ContextPair(
                        positive=200,
                        negative=300,
                    ),
                ],
            )
        ),
        limit=10,
    ),
]

client.query_batch_points(
    collection_name="{collection_name}", requests=discover_queries
)
```
