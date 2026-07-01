```python
from qdrant_edge import Point, UpdateOperation

shard.update(UpdateOperation.upsert_points([
    Point(1, {"text": bm25.embed_document("the quick brown fox")}, {"title": "Article 1"}),
    Point(2, {"text": bm25.embed_document("a lazy dog sleeps")},   {"title": "Article 2"}),
    Point(3, {"text": bm25.embed_document("foxes are clever")},    {"title": "Article 3"}),
]))
shard.optimize()
```
