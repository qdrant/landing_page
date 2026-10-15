```python
from qdrant_edge import EdgeShard, Filter, ScrollRequest, SliceCondition

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            SliceCondition(total=8, index=3),
        ],
    ),
))
```
