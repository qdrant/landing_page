```python
# Qdrant Edge doesn't support looking up vectors from another collection, but it can be
# implemented as follows. Each Edge shard holds a single collection, so load a second shard
# for the other collection, retrieve the vectors from it, and recommend with those vectors.
from qdrant_edge import EdgeShard, Query, QueryRequest, RecommendQuery

external_shard = EdgeShard.load("./{external_collection_name}")

points = external_shard.retrieve(
    point_ids=[100, 231, 718],
    with_payload=False,
    with_vector=["{external_vector_name}"],
)
vectors = {point.id: point.vector["{external_vector_name}"] for point in points}

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
