SHARD_DIRECTORY = "./qdrant-edge-bm25"

# @block-start configure-bm25-shard
from qdrant_edge import Distance, EdgeConfig, EdgeShard, EdgeVectorParams

config = EdgeConfig(
    vectors={"embedding": EdgeVectorParams(size=4, distance=Distance.Cosine)},
)

shard = EdgeShard.create(SHARD_DIRECTORY, config)
# @block-end configure-bm25-shard

# @block-start create-bm25-index
from qdrant_edge import (
    Language,
    SnowballLanguage,
    SnowballParams,
    TextIndexParams,
    UpdateOperation,
)

shard.update(UpdateOperation.create_field_index(
    "title",
    TextIndexParams(
        scoring=True,
        stemmer=SnowballParams(language=SnowballLanguage.English),
        stopwords=Language.English,
    ),
))
# @block-end create-bm25-index

# @block-start upsert-points
from qdrant_edge import Point, UpdateOperation

shard.update(UpdateOperation.upsert_points([
    Point(1, {"embedding": [0.05, 0.61, 0.76, 0.74]}, {"title": "The Time Machine"}),
    Point(2, {"embedding": [0.19, 0.81, 0.75, 0.11]}, {"title": "Time Travel in Einstein's Universe"}),
    Point(3, {"embedding": [0.36, 0.55, 0.47, 0.94]}, {"title": "The Travels of Marco Polo"}),
]))
# @block-end upsert-points

# @block-start query-bm25
from qdrant_edge import QueryRequest, TextQuery

results = shard.query(QueryRequest(
    query=TextQuery("title", "time travel"),
    limit=3,
    with_payload=True,
))
# @block-end query-bm25

# @block-start query-bm25-params
from qdrant_edge import Bm25Params, QueryRequest, TextQuery

results = shard.query(QueryRequest(
    query=TextQuery("title", "time travel", scoring=Bm25Params(k=1.5, b=0.5)),
    limit=3,
    with_payload=True,
))
# @block-end query-bm25-params
