```python
from qdrant_client.models import Fusion, FusionQuery, Prefetch

query = "a vegetarian dish with tahini"

results = client.query_points(
    "menu",
    prefetch=[
        Prefetch(query=dense([query], query=True)[0], using="dense", limit=10),
        Prefetch(query=sparse([query], query=True)[0], using="bm25", limit=10),
    ],
    query=FusionQuery(fusion=Fusion.RRF),
    limit=3,
    with_payload=True,
).points

for hit in results:
    print(hit.payload["name"], hit.score)
```
