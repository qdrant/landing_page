from qdrant_edge import (
    EdgeShard,
    Expression,
    FieldCondition,
    Formula,
    MatchAny,
    Prefetch,
    Query,
    QueryRequest,
)

edge_shard = EdgeShard.load("./shard", None)  # @hide

tag_boosted = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([0.1, 0.45, 0.67]),  # <-- dense vector
            limit=50,
        ),
    ],
    query=Formula(
        formula=Expression.Sum([
            Expression.Variable("$score"),
            Expression.Mult([
                Expression.Constant(0.5),
                Expression.Condition(
                    FieldCondition(key="tag", match=MatchAny(any=["h1", "h2", "h3", "h4"]))
                ),
            ]),
            Expression.Mult([
                Expression.Constant(0.25),
                Expression.Condition(
                    FieldCondition(key="tag", match=MatchAny(any=["p", "li"]))
                ),
            ]),
        ]),
    ),
    limit=10,
))
