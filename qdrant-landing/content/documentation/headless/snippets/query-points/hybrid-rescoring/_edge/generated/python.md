```python
from qdrant_edge import Prefetch, Query, QueryRequest

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([1.0, 23.0, 45.0, 67.0], using="mrl_byte"),  # <--- small byte vector
            limit=1000,
        ),
    ],
    query=Query.Nearest([0.01, 0.299, 0.45, 0.67], using="full"),
    limit=10,
))
```
