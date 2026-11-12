```python
from qdrant_edge import Fusion, Prefetch, Query, QueryRequest, TextQuery

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=TextQuery("title", "time travel"),
            limit=20,
        ),
        Prefetch(
            query=Query.Nearest([0.01, 0.45, 0.67], using="dense"),
            limit=20,
        ),
    ],
    query=Fusion.Rrf(k=2),
    limit=10,
))
```
