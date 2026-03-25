```python
from qdrant_edge import ( Point, UpdateOperation )
from qdrant_client import models

id=1
vector=[0.1, 0.2, 0.3, 0.4]
payload={"color": "red"}

point = Point(
    id=id,
    vector={VECTOR_NAME: vector},
    payload=payload
)

edge_shard.update(UpdateOperation.upsert_points([point]))

rest_point = models.PointStruct(id=id, vector={VECTOR_NAME: vector}, payload=payload)

upload_queue.put(rest_point)
```
