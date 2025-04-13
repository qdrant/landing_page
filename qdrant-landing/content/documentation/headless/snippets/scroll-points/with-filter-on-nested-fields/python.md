```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="country.name", match=models.MatchValue(value="Germany")
            ),
        ],
    ),
)
```
