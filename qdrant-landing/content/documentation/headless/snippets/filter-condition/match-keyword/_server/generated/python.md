```python
from qdrant_client import models

models.FieldCondition(
    key="color",
    match=models.MatchValue(value="red"),
)
```
