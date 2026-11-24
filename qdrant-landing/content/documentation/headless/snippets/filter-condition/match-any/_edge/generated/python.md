```python
from qdrant_edge import FieldCondition, MatchAny

FieldCondition(
    key="color",
    match=MatchAny(any=["black", "yellow"]),
)
```
