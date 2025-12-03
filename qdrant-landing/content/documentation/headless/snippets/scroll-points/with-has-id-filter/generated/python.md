```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.HasIdCondition(has_id=[1, 3, 5, 7, 9, 11]),
        ],
    ),
)
```
