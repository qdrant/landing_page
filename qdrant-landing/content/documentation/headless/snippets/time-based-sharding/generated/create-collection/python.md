```python
from qdrant_client import models

collection_name = "my_collection"

if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense_vector": models.VectorParams(
            size=384, distance=models.Distance.COSINE
        )
    },
    sharding_method=models.ShardingMethod.CUSTOM,
    shard_number=1, # The number of shards per shard key
)
```
