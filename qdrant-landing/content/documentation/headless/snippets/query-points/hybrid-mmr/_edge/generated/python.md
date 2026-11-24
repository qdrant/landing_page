```python
from qdrant_edge import EdgeShard, Mmr, QueryRequest

edge_shard.query(QueryRequest(
    query=Mmr(
        vector=[0.01, 0.45, 0.67],  # search vector
        lambda_=0.5,  # 0.0 - diversity; 1.0 - relevance
        candidates_limit=100,  # num of candidates to preselect
    ),
    limit=10,
))
```
