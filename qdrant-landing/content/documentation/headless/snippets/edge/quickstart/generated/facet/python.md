```python
from qdrant_edge import FacetRequest

facet_response = edge_shard.facet(FacetRequest(key="color", limit=10, exact=False))
```
