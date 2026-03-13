```python
from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    VectorDataConfig,
)

SHARD_DIRECTORY = "./qdrant-edge-directory"
VECTOR_DIMENSION = 512
VECTOR_NAME="my-vector"

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
config = EdgeConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

edge_shard = EdgeShard(SHARD_DIRECTORY, config)
```
