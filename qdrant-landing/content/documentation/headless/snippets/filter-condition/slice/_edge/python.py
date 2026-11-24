# mypy: disable-error-code="attr-defined"
from qdrant_edge import EdgeShard, Filter, ScrollRequest, SliceCondition

edge_shard = EdgeShard.load("./shard", None)  # @hide

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            SliceCondition(total=8, index=3),
        ],
    ),
))
