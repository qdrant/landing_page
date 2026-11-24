from qdrant_edge import EdgeShard, Filter, HasVectorCondition, ScrollRequest

edge_shard = EdgeShard.load("./shard", None)  # @hide

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            HasVectorCondition(vector="image"),
        ],
    ),
))
