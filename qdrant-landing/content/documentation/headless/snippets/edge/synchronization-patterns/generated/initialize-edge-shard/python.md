```python
from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeConfig,
    VectorDataConfig,
)

SHARD_DIRECTORY = "./qdrant-edge-directory"
VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

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
