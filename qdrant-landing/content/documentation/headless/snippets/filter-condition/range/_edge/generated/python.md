```python
from qdrant_edge import FieldCondition, RangeFloat

FieldCondition(
    key="price",
    range=RangeFloat(
        gt=None,
        gte=100.0,
        lt=None,
        lte=450.0,
    ),
)
```
