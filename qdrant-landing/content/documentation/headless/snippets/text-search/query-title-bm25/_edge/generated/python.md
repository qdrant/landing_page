```python
from qdrant_edge import QueryRequest, TextQuery

results = edge_shard.query(QueryRequest(
    query=TextQuery("title", "time travel"),
    limit=10,
    with_payload=True,
))
```
