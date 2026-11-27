```python
from qdrant_client import QdrantClient, models

client.create_payload_index(
    collection_name="venues",
    field_name="location",
    field_schema=models.PayloadSchemaType.GEO,
)
```
