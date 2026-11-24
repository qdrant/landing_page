```python
from qdrant_client import models

models.FieldCondition(
    key="description",
    match=models.MatchText(text="good cheap"),
)
```
