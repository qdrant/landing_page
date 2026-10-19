```python
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    EdgeVectorParams,
    TextIndexParams,
    UpdateOperation,
)

edge_shard = EdgeShard.create(
    "./shard",
    EdgeConfig(
        vectors={
            "description-dense": EdgeVectorParams(size=384, distance=Distance.Cosine),
        },
    ),
)

edge_shard.update(UpdateOperation.create_field_index(
    "title",
    TextIndexParams(scoring=True),
))
```
