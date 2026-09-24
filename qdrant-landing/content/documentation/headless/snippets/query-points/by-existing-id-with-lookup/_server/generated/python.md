```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query="43cf51e2-8777-4f52-bc74-c2cbde0c8b04",  # <--- point id
    using="512d-vector",
    lookup_from=models.LookupLocation(
        collection="another_collection",  # <--- other collection name
        vector="image-512",  # <--- vector name in the other collection
    )
)
```
