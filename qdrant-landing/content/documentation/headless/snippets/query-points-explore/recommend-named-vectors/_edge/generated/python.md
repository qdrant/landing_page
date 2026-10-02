```python
from qdrant_edge import EdgeShard, Query, QueryRequest, RecommendQuery

# Look up the stored "image" vectors of the example points
points = edge_shard.retrieve(point_ids=[100, 231, 718], with_payload=False, with_vector=["image"])
vectors = {point.id: point.vector["image"] for point in points}

edge_shard.query(QueryRequest(
    query=Query.RecommendBestScore(
        RecommendQuery(
            positives=[vectors[100], vectors[231]],
            negatives=[vectors[718]],
        ),
        using="image",
    ),
    limit=10,
))
```
