```python
from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    VectorDataConfig,
)

MUTABLE_SHARD_DIR = "./qdrant-edge-directory/mutable"

Path(MUTABLE_SHARD_DIR).mkdir(parents=True, exist_ok=True)

VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

config = EdgeConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

mutable_shard = EdgeShard(MUTABLE_SHARD_DIR, config)
```
