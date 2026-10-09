```python
from qdrant_edge import EdgeShard, Filter, HasVectorCondition, ScrollRequest

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            HasVectorCondition(vector="image"),
        ],
    ),
))
```
