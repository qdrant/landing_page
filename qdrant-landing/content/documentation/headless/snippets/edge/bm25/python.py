from pathlib import Path

SHARD_DIRECTORY = "./qdrant-edge-bm25"
Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True) # @hide

# @block-start configure-bm25-shard
from qdrant_edge import (
    EdgeConfig,
    EdgeShard,
    EdgeSparseVectorParams,
    Modifier,
)

config = EdgeConfig(
    sparse_vectors={"text": EdgeSparseVectorParams(modifier=Modifier.Idf)},
)

shard = EdgeShard.create(SHARD_DIRECTORY, config)
# @block-end configure-bm25-shard

# @block-start create-bm25
from qdrant_edge import Bm25, Bm25Config

bm25 = Bm25(Bm25Config(language="english"))
# @block-end create-bm25

# @block-start embed-and-upsert
from qdrant_edge import Point, UpdateOperation

shard.update(UpdateOperation.upsert_points([
    Point(1, {"text": bm25.embed_document("the quick brown fox")}, {"title": "Article 1"}),
    Point(2, {"text": bm25.embed_document("a lazy dog sleeps")},   {"title": "Article 2"}),
    Point(3, {"text": bm25.embed_document("foxes are clever")},    {"title": "Article 3"}),
]))
shard.optimize()
# @block-end embed-and-upsert

# @block-start query-with-bm25
from qdrant_edge import Query, QueryRequest

query_vector = bm25.embed_query("clever fox")

results = shard.query(QueryRequest(
    query=Query.Nearest(query_vector, using="text"),
    limit=3,
    with_payload=True,
))
# @block-end query-with-bm25
