```python
from pathlib import Path

SHARD_DIRECTORY = "./qdrant-edge-directory"

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)

from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeVectorParams,
)

VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

from qdrant_edge import EdgeShard

edge_shard = EdgeShard(SHARD_DIRECTORY, config)

from qdrant_edge import ( Point, UpdateOperation )

point = Point(
    id=1,
    vector={VECTOR_NAME: [0.1, 0.2, 0.3, 0.4]},
    payload={"color": "red"}
)

edge_shard.update(UpdateOperation.upsert_points([point]))

records = edge_shard.retrieve(
    point_ids=[1],
    with_payload=True,
    with_vector=False
)

from qdrant_edge import Query, QueryRequest

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)

from qdrant_edge import FieldCondition, Filter, MatchValue

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
        filter=Filter(
            must=[
                FieldCondition(
                    key="color",
                    match=MatchValue(value="red"),
                )
            ]
        ),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)

from qdrant_edge import FacetRequest

facet_response = edge_shard.facet(FacetRequest(key="color", limit=10, exact=False))

edge_shard.optimize()

from qdrant_edge import EdgeOptimizersConfig

config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    },
    optimizers=EdgeOptimizersConfig(
        deleted_threshold=0.2,
        vacuum_min_vector_number=100,
        default_segment_number=2,
    ),
)

from qdrant_edge import PayloadSchemaType

edge_shard.update(UpdateOperation.create_field_index("color", PayloadSchemaType.Keyword))

edge_shard.close()

edge_shard = EdgeShard(SHARD_DIRECTORY)
```
