```python
from qdrant_edge import QueryRequest, TextQuery

results = shard.query(QueryRequest(
    query=TextQuery("title", "time travel"),
    limit=3,
    with_payload=True,
))
```
