```python
from qdrant_edge import Bm25Params, QueryRequest, TextQuery

results = edge_shard.query(QueryRequest(
    query=TextQuery("title", "time travel", scoring=Bm25Params(k=1.5, b=0.5)),
    limit=10,
    with_payload=True,
))
```
