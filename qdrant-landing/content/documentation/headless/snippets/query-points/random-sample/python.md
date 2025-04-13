```python
from qdrant_client import QdrantClient, models


sampled = client.query_points(
    collection_name="{collection_name}",
    query=models.SampleQuery(sample=models.Sample.RANDOM)
)
```
