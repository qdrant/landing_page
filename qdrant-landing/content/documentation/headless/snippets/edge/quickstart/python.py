# @block-start create-storage-directory
from pathlib import Path

SHARD_DIRECTORY = "./qdrant-edge-directory"

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
# @block-end create-storage-directory

# @block-start configure-edge-shard
from qdrant_edge import (
    Distance,
    EdgeConfig,
    VectorDataConfig,
)

VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

config = EdgeConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)
# @block-end configure-edge-shard

# @block-start initialize-edge-shard
from qdrant_edge import EdgeShard

edge_shard = EdgeShard(SHARD_DIRECTORY, config)
# @block-end initialize-edge-shard

# @block-start upsert-points
from qdrant_edge import ( Point, UpdateOperation )

point = Point(
    id=1,
    vector={VECTOR_NAME: [0.1, 0.2, 0.3, 0.4]},
    payload={"color": "red"}
)

edge_shard.update(UpdateOperation.upsert_points([point]))
# @block-end upsert-points

# @block-start retrieve-point
point = edge_shard.retrieve(
    point_ids=[1],
    with_payload=True,
    with_vector=False
)
# @block-end retrieve-point

# @block-start query-points
from qdrant_edge import Query, QueryRequest

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
# @block-end query-points

# @block-start close-edge-shard
edge_shard.close()
# @block-end close-edge-shard

# @block-start load-edge-shard
edge_shard = EdgeShard(SHARD_DIRECTORY)
# @block-end load-edge-shard
