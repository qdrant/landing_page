from qdrant_edge import EdgeShard, Expression, Formula, Prefetch, Query, QueryRequest

edge_shard = EdgeShard.load("./shard", None)  # @hide

geodesic = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([-1.118, 0.3, 0.4]),  # <-- the sign of the first element is flipped
            limit=100,
        ),
    ],
    query=Formula(
        formula=Expression.Neg(
            Expression.Acosh(
                Expression.Neg(Expression.Variable("$score")),
            ),
        ),
    ),
    limit=10,
))
