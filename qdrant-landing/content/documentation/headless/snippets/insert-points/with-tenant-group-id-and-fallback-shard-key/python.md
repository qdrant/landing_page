```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={"group_id": "user_1"},
            vector=[0.9, 0.1, 0.1],
        ),
    ],
    shard_key_selector=models.ShardKeyWithFallback(
        target="user_1",
        fallback="default"
    )
)
```
