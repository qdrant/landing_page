```python
from qdrant_edge import Modifier

edge_shard.update(UpdateOperation.create_sparse_vector(
    vector_name="text",
    modifier=Modifier.Idf,
))
```
