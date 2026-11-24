```python
from qdrant_edge import Query, QueryRequest

results = edge_shard.query(QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7]),
    with_vector=True,
    with_payload=True,
    limit=10,
))
```
