```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.query_points(
    collection_name="books",
    query=models.Document(text="time travel", model="qdrant/bm25"),
    using="title-bm25",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(key="tenant", match=models.MatchValue(value="acme")),
            models.FieldCondition(key="year", match=models.MatchValue(value=2024)),
        ]
    ),
    search_params=models.SearchParams(
        idf=models.IdfParams(
            corpus=models.Filter(
                must=[
                    models.FieldCondition(
                        key="tenant", match=models.MatchValue(value="acme")
                    ),
                ]
            )
        )
    ),
    limit=10,
)
```
