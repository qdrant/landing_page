from qdrant_edge import (
    EdgeShard,
    FieldCondition,
    Filter,
    MatchValue,
    NestedCondition,
    ScrollRequest,
)

edge_shard = EdgeShard.load("./shard", None)  # @hide

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            NestedCondition(
                key="diet",
                filter=Filter(
                    must=[
                        FieldCondition(key="food", match=MatchValue(value="meat")),
                        FieldCondition(key="likes", match=MatchValue(value=True)),
                    ],
                ),
            ),
        ],
    ),
))
