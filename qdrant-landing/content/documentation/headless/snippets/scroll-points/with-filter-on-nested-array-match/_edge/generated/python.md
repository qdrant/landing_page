```python
from qdrant_edge import EdgeShard, FieldCondition, Filter, MatchValue, ScrollRequest

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        should=[
            FieldCondition(
                key="country.cities[].sightseeing",
                match=MatchValue(value="Osaka Castle"),
            ),
        ],
    ),
))
```
