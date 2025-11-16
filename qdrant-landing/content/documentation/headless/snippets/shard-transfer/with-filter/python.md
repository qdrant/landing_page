```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")


client.cluster_collection_update(
    collection_name="{collection_name}",
    cluster_operation=models.ReplicatePointsOperation(
        replicate_points=models.ReplicatePoints(
            from_shard_key="default",
            to_shard_key="user_1",
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="group_id",
                        match=models.MatchValue(
                            value="user_1",
                        )
                    )
                ]
            )
        )
    )
)
```
