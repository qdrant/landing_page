from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

from qdrant_edge import QueryRequest, Sample

sampled = edge_shard.query(QueryRequest(
    query=Sample.Random,
    limit=10,
))
