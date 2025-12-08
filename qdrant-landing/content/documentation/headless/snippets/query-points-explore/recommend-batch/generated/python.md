```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

filter_ = models.Filter(
    must=[
        models.FieldCondition(
            key="city",
            match=models.MatchValue(
                value="London",
            ),
        )
    ]
)

recommend_queries = [
    models.QueryRequest(
        query=models.RecommendQuery(
            recommend=models.RecommendInput(positive=[100, 231], negative=[718])
        ),
        filter=filter_,
        limit=3,
    ),
    models.QueryRequest(
        query=models.RecommendQuery(
            recommend=models.RecommendInput(positive=[200, 67], negative=[300])
        ),
        filter=filter_,
        limit=3,
    ),
]

client.query_batch_points(
    collection_name="{collection_name}", requests=recommend_queries
)
```
