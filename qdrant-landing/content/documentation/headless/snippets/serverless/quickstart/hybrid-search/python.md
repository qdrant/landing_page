```python
from qdrant_client.models import Document, Fusion, FusionQuery, Prefetch, TextQuery

query = "a vegetarian dish with tahini"

results = client.query_points(
    "menu",
    prefetch=[
        Prefetch(query=Document(text=query, model=MODEL), using="dense", limit=10),
        Prefetch(query=TextQuery(text=query), using="description", limit=10),
    ],
    query=FusionQuery(fusion=Fusion.RRF),
    limit=3,
    with_payload=True,
).points

for hit in results:
    print(hit.payload["name"], hit.score)
```
