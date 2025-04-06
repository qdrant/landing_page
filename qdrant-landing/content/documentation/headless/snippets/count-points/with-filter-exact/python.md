```python
client.count(
    collection_name="{collection_name}",
    count_filter=models.Filter(
        must=[
            models.FieldCondition(key="color", match=models.MatchValue(value="red")),
        ]
    ),
    exact=True,
)
```
