```python
from qdrant_edge import (
    Filter,
    FieldCondition,
    RangeFloat
)

mutable_shard.update(
    UpdateOperation.delete_points_by_filter(Filter(
        must=[
            FieldCondition(
                key=SYNC_TIMESTAMP_KEY, range=RangeFloat(lte=sync_timestamp)
            )
        ])
    )
)
```
