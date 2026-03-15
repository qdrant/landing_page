```python
from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    EdgeVectorParams,
)

MUTABLE_SHARD_DIR = "./qdrant-edge-directory/mutable"

Path(MUTABLE_SHARD_DIR).mkdir(parents=True, exist_ok=True)

VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

mutable_shard = EdgeShard(MUTABLE_SHARD_DIR, config)
```
