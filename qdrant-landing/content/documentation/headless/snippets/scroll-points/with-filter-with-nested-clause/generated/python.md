```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.NestedCondition(
                nested=models.Nested(
                    key="diet",
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="food", match=models.MatchValue(value="meat")
                            ),
                            models.FieldCondition(
                                key="likes", match=models.MatchValue(value=True)
                            ),
                        ]
                    ),
                )
            )
        ],
    ),
)
```
