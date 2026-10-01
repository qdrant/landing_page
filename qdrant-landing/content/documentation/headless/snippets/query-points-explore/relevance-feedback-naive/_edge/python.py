# mypy: disable-error-code="arg-type"
from qdrant_edge import (
    EdgeShard,
    FeedbackItem,
    FeedbackNaiveQuery,
    NaiveFeedbackStrategy,
    Query,
    QueryRequest,
)

edge_shard = EdgeShard.load("./shard", None)  # @hide

# Look up the stored vectors of the feedback examples
points = edge_shard.retrieve(
    point_ids=[111, 222, 333], with_payload=False, with_vector=True
)
vectors = {point.id: point.vector for point in points}

edge_shard.query(QueryRequest(
    query=Query.FeedbackNaive(
        FeedbackNaiveQuery(
            target=[0.1, 0.9, 0.23],
            feedback=[
                FeedbackItem(vector=vectors[111], score=0.68),
                FeedbackItem(vector=vectors[222], score=0.72),
                FeedbackItem(vector=vectors[333], score=0.61),
            ],
            strategy=NaiveFeedbackStrategy(a=0.12, b=0.43, c=0.03),
        )
    ),
    limit=10,
))
