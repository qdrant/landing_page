```python
from qdrant_client import QdrantClient, models

client.query_points(
    collection_name="{collection_name}",
    query=models.TextQuery(text="time travel"),
    using="title",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(key="group_id", match=models.MatchValue(value="user_1")),
            models.FieldCondition(key="year", match=models.MatchValue(value=2024)),
        ]
    ),
    search_params=models.SearchParams(
        idf=models.IdfCorpusParams(
            corpus=models.Filter(
                must=[
                    models.FieldCondition(
                        key="group_id", match=models.MatchValue(value="user_1")
                    ),
                ]
            )
        )
    ),
    limit=10,
    with_payload=True,
)
```
