```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector=[0.9, 0.1, 0.1],
            payload={
                "color": "red",
            },
        ),
        models.PointStruct(
            id=2,
            vector=[0.1, 0.9, 0.1],
            payload={
                "color": "green",
            },
        ),
        models.PointStruct(
            id=3,
            vector=[0.1, 0.1, 0.9],
            payload={
                "color": "blue",
            },
        ),
    ],
    update_mode=models.UpdateMode.INSERT_ONLY
)
```
