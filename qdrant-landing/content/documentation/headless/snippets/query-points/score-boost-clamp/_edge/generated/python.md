```python
from qdrant_edge import EdgeShard, Expression, Formula, Prefetch, Query, QueryRequest

clamped = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([0.1, 0.45, 0.67]),  # <-- dense vector
            limit=50,
        ),
    ],
    query=Formula(
        formula=Expression.Sum([
            Expression.Variable("$score"),
            # clamp `rating` into the range [0, 1]
            Expression.Max([
                Expression.Constant(0.0),
                Expression.Min([Expression.Constant(1.0), Expression.Variable("rating")]),
            ]),
        ]),
    ),
    limit=10,
))
```
