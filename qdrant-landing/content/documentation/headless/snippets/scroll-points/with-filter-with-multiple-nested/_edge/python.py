from qdrant_edge import EdgeShard, FieldCondition, Filter, MatchValue, ScrollRequest

edge_shard = EdgeShard.load("./shard", None)  # @hide

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            FieldCondition(key="diet[].food", match=MatchValue(value="meat")),
            FieldCondition(key="diet[].likes", match=MatchValue(value=True)),
        ],
    ),
))
