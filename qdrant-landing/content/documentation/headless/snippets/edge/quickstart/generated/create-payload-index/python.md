```python
from qdrant_edge import PayloadSchemaType

edge_shard.update(UpdateOperation.create_field_index("color", PayloadSchemaType.Keyword))
```
