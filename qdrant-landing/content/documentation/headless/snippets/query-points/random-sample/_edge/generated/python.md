```python
from qdrant_edge import QueryRequest, Sample

sampled = edge_shard.query(QueryRequest(
    query=Sample.Random,
    limit=10,
))
```
