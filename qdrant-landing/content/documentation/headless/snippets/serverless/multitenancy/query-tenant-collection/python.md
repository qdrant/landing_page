```python
from qdrant_client.models import Document

results = client.query_points(
    f"tenant-{tenant_id}",
    query=Document(text="quarterly report", model="sentence-transformers/all-minilm-l6-v2"),
    limit=10,
).points
```
