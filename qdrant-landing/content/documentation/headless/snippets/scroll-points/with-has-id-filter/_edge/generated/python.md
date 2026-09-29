```python
from qdrant_edge import EdgeShard, Filter, HasIdCondition, ScrollRequest

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            HasIdCondition(point_ids={1, 3, 5, 7, 9, 11}),
        ],
    ),
))
```
