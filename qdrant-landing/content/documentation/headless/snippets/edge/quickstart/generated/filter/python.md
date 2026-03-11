```python
from qdrant_edge import FieldCondition, Filter, MatchValue

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
        filter=Filter(
            must=[
                FieldCondition(
                    key="color",
                    match=MatchValue(value="red"),
                )
            ]
        ),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
```
