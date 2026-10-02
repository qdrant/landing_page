```python
from qdrant_edge import ContextPair, ContextQuery, EdgeShard, Query, QueryRequest

# Look up the stored vectors of the context points
points = edge_shard.retrieve(
    point_ids=[100, 718, 200, 300], with_payload=False, with_vector=True
)
vectors = {point.id: point.vector for point in points}

edge_shard.query(QueryRequest(
    query=Query.Context(
        ContextQuery(
            pairs=[
                ContextPair(
                    positive=vectors[100],
                    negative=vectors[718],
                ),
                ContextPair(
                    positive=vectors[200],
                    negative=vectors[300],
                ),
            ],
        )
    ),
    limit=10,
))
```
