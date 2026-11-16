```python
from qdrant_edge import Distance, EdgeConfig, EdgeShard, EdgeVectorParams

config = EdgeConfig(
    vectors={"embedding": EdgeVectorParams(size=4, distance=Distance.Cosine)},
)

shard = EdgeShard.create(SHARD_DIRECTORY, config)
```
