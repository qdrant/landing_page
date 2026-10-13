```python
from qdrant_client import models

models.FieldCondition(
    key="url",
    match=models.MatchSubstring(substring="qdrant.tech/"),
)
```
