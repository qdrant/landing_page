```python
from qdrant_edge import Prefetch, Query, QueryRequest

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            prefetches=[
                Prefetch(
                    query=Query.Nearest([1.0, 23.0, 45.0, 67.0], using="mrl_byte"),  # <--- small byte vector
                    limit=1000,
                ),
            ],
            query=Query.Nearest([0.01, 0.45, 0.67], using="full"),
            limit=100,
        ),
    ],
    query=Query.Nearest(
        [
            [0.17, 0.23, 0.52],  # <─┐
            [0.22, 0.11, 0.63],  # < ├─ multi-vector
            [0.86, 0.93, 0.12],  # < ┘
        ],
        using="colbert",
    ),
    limit=10,
))
```
