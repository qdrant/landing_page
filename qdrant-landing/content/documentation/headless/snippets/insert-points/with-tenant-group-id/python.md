```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={"group_id": "user_1"},
            vector=[0.9, 0.1, 0.1],
        ),
        models.PointStruct(
            id=2,
            payload={"group_id": "user_1"},
            vector=[0.1, 0.9, 0.1],
        ),
        models.PointStruct(
            id=3,
            payload={"group_id": "user_2"},
            vector=[0.1, 0.1, 0.9],
        ),
    ],
)
```
