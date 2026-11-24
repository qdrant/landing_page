```python
from qdrant_edge import EdgeShard, FieldCondition, Filter, MatchValue, ScrollRequest

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        must=[
            FieldCondition(
                key="city",
                match=MatchValue(value="London"),
            ),
            FieldCondition(
                key="color",
                match=MatchValue(value="red"),
            ),
        ],
    ),
))
```
