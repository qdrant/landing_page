```python
from qdrant_edge import Query, QueryRequest

query_request = QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
    limit=10,
    with_vector=False,
    with_payload=True
)

mutable_results = mutable_shard.query(query_request)
immutable_results = immutable_shard.query(query_request)

all_results = list(mutable_results) + list(immutable_results)
all_results.sort(key=lambda x: x.score, reverse=True)

seen_ids = set()
unique_results = []
for result in all_results:
    if result.id not in seen_ids:
        seen_ids.add(result.id)
        unique_results.append(result)

results= [
    {
        "id": result.id,
        "score": result.score,
        "payload": result.payload
    }
    for result in unique_results[:10]
]
```
