```python
from qdrant_client import models

models.FieldCondition(
    key="count",
    match=models.MatchValue(value=0),
)
```
