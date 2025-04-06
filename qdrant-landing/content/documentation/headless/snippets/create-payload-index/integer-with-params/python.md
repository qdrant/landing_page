```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.IntegerIndexParams(
        type=models.IntegerIndexType.INTEGER,
        lookup=False,
        range=True,
    ),
)
```
