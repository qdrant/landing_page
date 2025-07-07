```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=models.NearestQuery(
        nearest=[0.01, 0.45, 0.67], # search vector
        mmr=models.Mmr(
            lambda_=0.5, # 0.0 - diversity; 1.0 - relevance
            candidate_limit=100, # num of candidates to preselect
        )
    ),
    limit=10,
)
```
