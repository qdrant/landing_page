```python
from qdrant_edge import EdgeShard, Expression, Formula, Prefetch, Query, QueryRequest

best_match = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(query=Query.Nearest([0.1, 0.45, 0.67], using="title"), limit=50),
        Prefetch(query=Query.Nearest([0.1, 0.45, 0.67], using="summary"), limit=50),
    ],
    query=Formula(
        formula=Expression.Max([
            Expression.Variable("$score[0]"),
            Expression.Variable("$score[1]"),
        ]),
        # used when a point is missing from the second prefetch
        defaults={"$score[1]": -1e30},
    ),
    limit=10,
))
```
