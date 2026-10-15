from qdrant_edge import (
    DecayKind,
    EdgeShard,
    Expression,
    Formula,
    GeoPoint,
    Prefetch,
    Query,
    QueryRequest,
)

edge_shard = EdgeShard.load("./shard", None)  # @hide

geo_boosted = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest([0.1, 0.45, 0.67]),  # <-- dense vector
            limit=50,
        ),
    ],
    query=Formula(
        formula=Expression.Sum([
            Expression.Variable("$score"),
            Expression.Decay(
                kind=DecayKind.Gauss,
                x=Expression.GeoDistance(
                    origin=GeoPoint(lat=52.504043, lon=13.393236),  # Berlin
                    to="geo.location",
                ),
                scale=5000.0,  # 5km
            ),
        ]),
        defaults={"geo.location": {"lat": 48.137154, "lon": 11.576124}},  # Munich
    ),
    limit=10,
))
