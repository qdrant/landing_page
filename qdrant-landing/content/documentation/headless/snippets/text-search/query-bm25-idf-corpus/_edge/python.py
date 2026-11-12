from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

from qdrant_edge import (
    FieldCondition,
    Filter,
    IdfParams,
    MatchValue,
    QueryRequest,
    SearchParams,
    TextQuery,
)

results = edge_shard.query(QueryRequest(
    query=TextQuery("title", "time travel"),
    filter=Filter(
        must=[
            FieldCondition(key="group_id", match=MatchValue(value="user_1")),
            FieldCondition(key="year", match=MatchValue(value=2024)),
        ],
    ),
    params=SearchParams(
        idf=IdfParams(
            corpus=Filter(
                must=[
                    FieldCondition(key="group_id", match=MatchValue(value="user_1")),
                ],
            ),
        ),
    ),
    limit=10,
    with_payload=True,
))
