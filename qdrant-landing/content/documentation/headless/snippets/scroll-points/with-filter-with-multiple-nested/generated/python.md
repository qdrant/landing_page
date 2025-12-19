```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="diet[].food", match=models.MatchValue(value="meat")
            ),
            models.FieldCondition(
                key="diet[].likes", match=models.MatchValue(value=True)
            ),
        ],
    ),
)
```
