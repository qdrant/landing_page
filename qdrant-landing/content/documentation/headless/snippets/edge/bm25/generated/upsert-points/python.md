```python
from qdrant_edge import Point, UpdateOperation

shard.update(UpdateOperation.upsert_points([
    Point(1, {"embedding": [0.05, 0.61, 0.76, 0.74]}, {"title": "The Time Machine"}),
    Point(2, {"embedding": [0.19, 0.81, 0.75, 0.11]}, {"title": "Time Travel in Einstein's Universe"}),
    Point(3, {"embedding": [0.36, 0.55, 0.47, 0.94]}, {"title": "The Travels of Marco Polo"}),
]))
```
