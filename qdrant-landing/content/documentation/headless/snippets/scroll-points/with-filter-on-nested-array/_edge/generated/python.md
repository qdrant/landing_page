```python
from qdrant_edge import EdgeShard, FieldCondition, Filter, RangeFloat, ScrollRequest

edge_shard.scroll(ScrollRequest(
    filter=Filter(
        should=[
            FieldCondition(
                key="country.cities[].population",
                range=RangeFloat(gte=9.0),
            ),
        ],
    ),
))
```
