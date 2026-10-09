```python
from uuid import UUID

from qdrant_edge import Filter, HasIdCondition, Query, QueryRequest

seen_ids: set[int | str | UUID] = {83461, 19284, 57392, 44017, 91825}  # IDs returned on previous pages

results = edge_shard.query(QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7]),
    filter=Filter(
        must_not=[
            HasIdCondition(point_ids=seen_ids),
        ]
    ),
    limit=5,
))
```
