```python
from qdrant_edge import EdgeOptimizersConfig

config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    },
    optimizers=EdgeOptimizersConfig(
        deleted_threshold=0.2,
        vacuum_min_vector_number=100,
        default_segment_number=2,
    ),
)
```
