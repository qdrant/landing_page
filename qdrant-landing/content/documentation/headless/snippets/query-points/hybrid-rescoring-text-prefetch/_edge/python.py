from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

from qdrant_edge import Prefetch, Query, QueryRequest, TextQuery

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=TextQuery("title", "time travel"),
            limit=100,
        ),
    ],
    query=Query.Nearest([0.01, 0.45, 0.67], using="dense"),
    limit=10,
))
