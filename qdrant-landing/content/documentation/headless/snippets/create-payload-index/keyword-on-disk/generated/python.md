```python
from qdrant_client import QdrantClient, models

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="payload_field_name",
    field_schema=models.KeywordIndexParams(
        type=models.KeywordIndexType.KEYWORD,
        memory=models.Memory.COLD,
    ),
)
```
