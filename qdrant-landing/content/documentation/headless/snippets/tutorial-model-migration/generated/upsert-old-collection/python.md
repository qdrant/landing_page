```python
client.upsert(
    collection_name=OLD_COLLECTION,
    points=[
        models.PointStruct(
            id=1,
            vector=models.Document(
                text="Example document",
                model=OLD_MODEL,
            ),
            payload={"text": "Example document"}
        )
    ]
)
```
