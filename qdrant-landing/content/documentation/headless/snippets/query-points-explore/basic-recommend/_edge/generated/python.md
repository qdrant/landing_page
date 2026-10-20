```python
from qdrant_edge import (
    EdgeShard,
    FieldCondition,
    Filter,
    MatchValue,
    Query,
    QueryRequest,
    RecommendQuery,
)

# Look up the stored vectors of the example points
points = edge_shard.retrieve(point_ids=[100, 231, 718], with_payload=False, with_vector=True)
vectors = {point.id: point.vector for point in points}

edge_shard.query(QueryRequest(
    query=Query.RecommendBestScore(
        RecommendQuery(
            positives=[vectors[100], vectors[231]],
            negatives=[vectors[718], [0.2, 0.3, 0.4, 0.5]],
        )
    ),
    filter=Filter(
        must=[
            FieldCondition(key="city", match=MatchValue(value="London")),
        ],
    ),
    limit=3,
))
```
