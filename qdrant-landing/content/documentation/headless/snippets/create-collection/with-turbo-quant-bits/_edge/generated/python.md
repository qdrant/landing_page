```python
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    EdgeVectorParams,
    Memory,
    TurboQuantBitSize,
    TurboQuantQuantizationConfig,
)

edge_shard = EdgeShard.create(
    "./shard",
    EdgeConfig(
        vectors={
            "my-vector": EdgeVectorParams(
                size=1536,
                distance=Distance.Cosine,
                quantization_config=TurboQuantQuantizationConfig(
                    memory=Memory.Pinned,
                    bits=TurboQuantBitSize.Bits2,
                ),
            ),
        },
    ),
)
```
