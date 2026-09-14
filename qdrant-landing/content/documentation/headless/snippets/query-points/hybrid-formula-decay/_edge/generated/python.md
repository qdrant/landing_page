```python
from qdrant_edge import (
    DecayKind,
    Expression,
    Formula,
    Fusion,
    Prefetch,
    Query,
    QueryRequest,
    SparseVector,
)

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            prefetches=[
                Prefetch(
                    query=Query.Nearest(SparseVector(indices=[1, 42], values=[0.22, 0.8]), using="sparse"),
                    limit=100,
                ),
                Prefetch(
                    query=Query.Nearest([0.01, 0.45, 0.67], using="dense"),
                    limit=100,
                ),
            ],
            query=Fusion.Rrf(k=2),
            limit=100,
        ),
    ],
    query=Formula(
        formula=Expression.Sum([
            Expression.Variable("$score"),
            Expression.Mult([
                Expression.Constant(0.1),
                Expression.Decay(
                    kind=DecayKind.Exp,
                    x=Expression.DatetimeKey("published_at"),
                    target=Expression.Datetime("2025-01-01T00:00:00Z"),
                    midpoint=0.5,
                    scale=86400.0 * 180.0,
                ),
            ]),
        ]),
    ),
    limit=10,
))
```
