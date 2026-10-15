```python
# Each Edge shard holds a single collection, so create one shard for chunks and one for documents
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeShard,
    EdgeVectorParams,
    PayloadSchemaType,
    UpdateOperation,
)

chunks_shard = EdgeShard.create(
    "./chunks",
    EdgeConfig(vectors=EdgeVectorParams(size=4, distance=Distance.Cosine)),
)
chunks_shard.update(UpdateOperation.create_field_index("document_id", PayloadSchemaType.Integer))

documents_shard = EdgeShard.create(
    "./documents",
    EdgeConfig(),  # no vectors, payload only
)
```
