from qdrant_edge import EdgeShard, FieldCondition, Filter, MatchValue, ScrollRequest

edge_shard = EdgeShard.load("./shard", None)  # @hide

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        should=[
            FieldCondition(key="country.name", match=MatchValue(value="Germany")),
        ],
    ),
))
