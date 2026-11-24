```python
from qdrant_client import QdrantClient, models

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="country.cities[].sightseeing",
                match=models.MatchValue(value="Osaka Castle"),
            ),
        ],
    ),
)
```
