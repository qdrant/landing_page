```python
from qdrant_edge import EdgeShard, Expression, Formula, Prefetch, QueryRequest, TextQuery

best_fields = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(query=TextQuery(field="title", query="vector database"), limit=50),
        Prefetch(query=TextQuery(field="body", query="vector database"), limit=50),
    ],
    query=Formula(
        formula=Expression.Max([
            Expression.Mult([Expression.Constant(3.0), Expression.Variable("$score[0]")]),  # boost title matches
            Expression.Variable("$score[1]"),
        ]),
    ),
    limit=10,
))
```
