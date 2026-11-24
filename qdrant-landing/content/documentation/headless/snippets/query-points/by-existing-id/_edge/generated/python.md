```python
# Qdrant Edge doesn't support querying by point ID, but it can be implemented as follows.
# A dedicated API only helps on a server, where it saves a second request. On Edge, both
# calls are local, so retrieving the vector and then querying with it is just as efficient.
from qdrant_edge import Filter, HasIdCondition, Query, QueryRequest

point_id = "43cf51e2-8777-4f52-bc74-c2cbde0c8b04"

points = edge_shard.retrieve(point_ids=[point_id], with_payload=False, with_vector=True)

results = edge_shard.query(QueryRequest(
    query=Query.Nearest(points[0].vector),
    # Exclude the point itself from the results
    filter=Filter(must_not=[HasIdCondition(point_ids={point_id})]),
    limit=10,
))
```
