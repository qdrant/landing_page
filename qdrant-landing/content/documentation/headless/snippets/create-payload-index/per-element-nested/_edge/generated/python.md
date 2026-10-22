```python
from qdrant_edge import EdgeShard, FloatIndexParams, KeywordIndexParams, UpdateOperation

edge_shard.update(UpdateOperation.create_field_index(
    "offers[].shop",
    KeywordIndexParams(nested="offers"),
))

edge_shard.update(UpdateOperation.create_field_index(
    "offers[].price",
    FloatIndexParams(nested="offers"),
))
```
