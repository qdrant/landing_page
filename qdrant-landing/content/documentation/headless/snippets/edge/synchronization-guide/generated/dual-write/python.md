```python
from qdrant_edge import ( Point, UpdateOperation )
from qdrant_client import models
import time

SYNC_TIMESTAMP_KEY="timestamp"

id=2
vector=[0.4, 0.3, 0.2, 0.1]
payload={
    "color": "green",
    SYNC_TIMESTAMP_KEY: time.time()
}

point = Point(
    id=id,
    vector={VECTOR_NAME: vector},
    payload=payload
)

mutable_shard.update(UpdateOperation.upsert_points([point]))

rest_point = models.PointStruct(id=id, vector={VECTOR_NAME: vector}, payload=payload)

upload_queue.put(rest_point)
```
