```python
from qdrant_edge import FieldCondition, MatchPhrase

FieldCondition(
    key="description",
    match=MatchPhrase(phrase="brown fox"),
)
```
