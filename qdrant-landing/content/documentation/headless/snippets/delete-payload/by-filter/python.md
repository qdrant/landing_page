```python
client.delete_payload(
    collection_name="{collection_name}",
    keys=["color", "price"],
    points=models.Filter(
        must=[
            models.FieldCondition(
                key="color",
                match=models.MatchValue(value="red"),
            ),
        ],
    ),
)
```
