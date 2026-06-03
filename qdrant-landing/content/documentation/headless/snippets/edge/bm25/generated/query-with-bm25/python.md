```python
from qdrant_edge import Query, QueryRequest

query_vector = bm25.embed_query("clever fox")

results = shard.query(QueryRequest(
    query=Query.Nearest(query_vector, using="text"),
    limit=3,
    with_payload=True,
))
```
