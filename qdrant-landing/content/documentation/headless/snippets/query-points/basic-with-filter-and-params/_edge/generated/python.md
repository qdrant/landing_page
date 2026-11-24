```python
from qdrant_edge import FieldCondition, Filter, MatchValue, Query, QueryRequest, SearchParams

results = edge_shard.query(QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7]),
    filter=Filter(
        must=[
            FieldCondition(
                key="city",
                match=MatchValue(value="London"),
            )
        ]
    ),
    params=SearchParams(hnsw_ef=128, exact=False),
    limit=3,
))
```
