```python
from qdrant_edge import Query, QueryRequest, SearchParams

results = edge_shard.query(QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7]),
    params=SearchParams(exact=True),
    limit=10,
))
```
