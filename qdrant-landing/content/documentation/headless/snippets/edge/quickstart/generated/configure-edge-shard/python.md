```python
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeVectorParams,
)

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
```
