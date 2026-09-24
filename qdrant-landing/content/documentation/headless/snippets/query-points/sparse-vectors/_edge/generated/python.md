```python
from qdrant_edge import Query, QueryRequest, SparseVector

results = edge_shard.query(QueryRequest(
    query=Query.Nearest(
        SparseVector(indices=[1, 3, 5, 7], values=[0.1, 0.2, 0.3, 0.4]),
        using="text",
    ),
    limit=10,
))
```
