```python
from qdrant_edge import (
    DecayKind,
    EdgeShard,
    Expression,
    Formula,
    Prefetch,
    Query,
    QueryRequest,
)

time_boosted = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([0.1, 0.45, 0.67]),  # <-- dense vector
            limit=50,
        ),
    ],
    query=Formula(
        formula=Expression.Sum([
            Expression.Variable("$score"),  # the final score = score + exp_decay(target_time - x_time)
            Expression.Decay(
                kind=DecayKind.Exp,
                x=Expression.DatetimeKey("update_time"),  # payload key
                target=Expression.Datetime("YYYY-MM-DDT00:00:00Z"),  # current datetime
                scale=86400.0,  # 1 day in seconds
                midpoint=0.5,  # if item's "update_time" is more than 1 day apart from current datetime, relevance score is less than 0.5
            ),
        ]),
    ),
    limit=10,
))
```
