```python
from qdrant_edge import (
    EdgeConfig,
    EdgeShard,
    EdgeSparseVectorParams,
    Modifier,
)

config = EdgeConfig(
    sparse_vectors={"text": EdgeSparseVectorParams(modifier=Modifier.Idf)},
)

shard = EdgeShard.create(SHARD_DIRECTORY, config)
```
