```python
from qdrant_edge import Fusion, Prefetch, Query, QueryRequest

results = edge_shard.query(QueryRequest(
    prefetches=[
        # 2+ prefetches here
    ],
    query=Fusion.Rrf(k=60),
    limit=10,
))
```
