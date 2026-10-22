```python
from qdrant_edge import EdgeShard, Expression, Formula, Prefetch, Query, QueryRequest

capped_boost = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([0.1, 0.45, 0.67]),  # <-- dense vector
            limit=50,
        ),
    ],
    query=Formula(
        formula=Expression.Sum([
            Expression.Variable("$score"),
            Expression.Min([
                Expression.Constant(2.0),  # the boost can't exceed this value
                Expression.Mult([Expression.Constant(0.1), Expression.Variable("log_views")]),
            ]),
        ]),
    ),
    limit=10,
))
```
