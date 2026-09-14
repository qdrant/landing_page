from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

from qdrant_edge import Prefetch, Query, QueryRequest

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([0.01, 0.45, 0.67, 0.53], using="dense"),
            limit=100,
        ),
    ],
    query=Query.Nearest(
        [
            [0.1, 0.2, 0.32],  # <─┐
            [0.2, 0.1, 0.52],  # < ├─ multi-vector
            [0.8, 0.9, 0.93],  # < ┘
        ],
        using="colbert",
    ),
    limit=10,
))
