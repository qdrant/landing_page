```python
client.query_points(
    collection_name="{collection_name}",
    query=[0.1, 0.1, 0.9],
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="group_id",
                match=models.MatchValue(
                    value="user_1",
                ),
            )
        ]
    ),
    limit=10,
)
```
