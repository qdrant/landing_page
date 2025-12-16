```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(key="city", match=models.MatchValue(value="London")),
        ],
        must_not=[
            models.FieldCondition(key="color", match=models.MatchValue(value="red")),
        ],
    ),
)
```
