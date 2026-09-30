```python
from qdrant_client import QdrantClient, models

client.search_matrix_pairs(
    collection_name="{collection_name}",
    sample=10,
    limit=2,
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="color", match=models.MatchValue(value="red")
            ),
        ]
    ),
)
```
