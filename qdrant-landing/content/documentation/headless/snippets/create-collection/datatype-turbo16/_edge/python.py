# mypy: ignore-errors
from qdrant_edge import Distance, EdgeConfig, EdgeShard, EdgeVectorParams, VectorStorageDatatype

edge_shard = EdgeShard.create(
    "./shard",
    EdgeConfig(
        vectors={
            "my-vector": EdgeVectorParams(
                size=1024,
                distance=Distance.Cosine,
                datatype=VectorStorageDatatype.Turbo16,
            ),
        },
    ),
)
