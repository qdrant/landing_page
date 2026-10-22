```python
from qdrant_edge import Fusion, Prefetch, Query, QueryRequest, SparseVector

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest(SparseVector(indices=[1, 42], values=[0.22, 0.8]), using="sparse"),
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
