```python
from qdrant_client.models import TextQuery

results = client.query_points(
    "menu",
    query=TextQuery(text="tahini"),
    using="description",
    limit=3,
    with_payload=True,
).points

for hit in results:
    print(hit.payload["name"], hit.score)
```
