```python
from qdrant_edge import ( Point, UpdateOperation )

point = Point(
    id=1,
    vector={VECTOR_NAME: [0.1, 0.2, 0.3, 0.4]},
    payload={"color": "red"}
)

edge_shard.update(UpdateOperation.upsert_points([point]))
```
