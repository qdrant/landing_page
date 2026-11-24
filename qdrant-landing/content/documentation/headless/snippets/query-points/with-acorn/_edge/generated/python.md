```python
from qdrant_edge import AcornSearchParams, Query, QueryRequest, SearchParams

results = edge_shard.query(QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7]),
    params=SearchParams(
        acorn=AcornSearchParams(
            enable=True,
            max_selectivity=0.4,
        )
    ),
    limit=10,
))
```
