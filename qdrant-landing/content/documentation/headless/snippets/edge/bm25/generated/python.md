```python
from pathlib import Path

SHARD_DIRECTORY = "./qdrant-edge-bm25"

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

from qdrant_edge import Bm25, Bm25Config

bm25 = Bm25(Bm25Config(language="english"))

from qdrant_edge import Point, UpdateOperation

shard.update(UpdateOperation.upsert_points([
    Point(1, {"text": bm25.embed_document("the quick brown fox")}, {"title": "Article 1"}),
    Point(2, {"text": bm25.embed_document("a lazy dog sleeps")},   {"title": "Article 2"}),
    Point(3, {"text": bm25.embed_document("foxes are clever")},    {"title": "Article 3"}),
]))
shard.optimize()

from qdrant_edge import Query, QueryRequest

query_vector = bm25.embed_query("clever fox")

results = shard.query(QueryRequest(
    query=Query.Nearest(query_vector, using="text"),
    limit=3,
    with_payload=True,
))
```
