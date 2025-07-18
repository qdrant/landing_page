```python
from qdrant_client import models

collection_name = "{collection_name}"
# Create collection with custom sharding for time-based routing
if not client.collection_exists(collection_name):
    client.create_collection(
        collection_name=collection_name,
        vectors_config={
            "dense_vector": models.VectorParams(
                size=384, distance=models.Distance.COSINE
            )
        },
        shard_number=8,
        sharding_method=models.ShardingMethod.CUSTOM,
    )
    client.create_shard_key(collection_name, "day")

```