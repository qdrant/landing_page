# mypy: disable-error-code="call-overload,index"
from qdrant_edge import EdgeShard  # @hide
edge_shard = EdgeShard.load("./shard", None)  # @hide

# Qdrant Edge doesn't support looking up vectors from another collection, but it can be
# implemented as follows. Each Edge shard holds a single collection, so load a second shard
# for the other collection, retrieve the vector from it, and query with that vector.
from qdrant_edge import EdgeShard, Query, QueryRequest

another_shard = EdgeShard.load("./another-shard")

points = another_shard.retrieve(
    point_ids=["43cf51e2-8777-4f52-bc74-c2cbde0c8b04"],
    with_payload=False,
    with_vector=["image-512"],
)

results = edge_shard.query(QueryRequest(
    query=Query.Nearest(points[0].vector["image-512"], using="512d-vector"),
    limit=10,
))
