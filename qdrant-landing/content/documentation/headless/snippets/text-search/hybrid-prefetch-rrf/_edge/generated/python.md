```python
from fastembed import TextEmbedding
from qdrant_edge import Fusion, Prefetch, Query, QueryRequest, TextQuery

model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
dense_vector = list(model.query_embed("time travel"))[0].tolist()

results = edge_shard.query(QueryRequest(
    prefetches=[
        Prefetch(
            query=Query.Nearest(dense_vector, using="description-dense"),
            limit=10,
            score_threshold=0.5,
        ),
        Prefetch(
            query=TextQuery("title", "time travel"),
            limit=10,
        ),
    ],
    query=Fusion.Rrf(k=2),
    limit=10,
    with_payload=True,
))
```
