```python
from qdrant_edge import TextIndexParams, UpdateOperation

edge_shard.update(UpdateOperation.create_field_index(
    "title",
    TextIndexParams(scoring=True),
))
```
