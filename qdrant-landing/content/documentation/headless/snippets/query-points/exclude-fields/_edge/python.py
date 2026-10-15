from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

from qdrant_edge import PayloadSelector, Query, QueryRequest

results = edge_shard.query(QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7]),
    with_payload=PayloadSelector.Exclude(["city"]),
    limit=10,
))
