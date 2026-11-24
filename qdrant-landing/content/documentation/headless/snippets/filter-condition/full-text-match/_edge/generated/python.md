```python
from qdrant_edge import FieldCondition, MatchText

FieldCondition(
    key="description",
    match=MatchText(text="good cheap"),
)
```
