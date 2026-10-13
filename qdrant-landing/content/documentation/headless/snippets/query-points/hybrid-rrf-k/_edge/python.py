# mypy: ignore-errors
from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

from qdrant_edge import Fusion, Prefetch, Query, QueryRequest

results = edge_shard.query(QueryRequest(
    prefetches=[
        # 2+ prefetches here
    ],
    query=Fusion.Rrf(k=60),
    limit=10,
))
