```python
client.upsert(
    collection_name=COLLECTION,
    points=[
        models.PointStruct(
            id=1,
            vector={
                OLD_VECTOR: models.Document(
                    text="Example document",
                    model=OLD_MODEL,
                ),
                NEW_VECTOR: models.Document(
                    text="Example document",
                    model=NEW_MODEL,
                ),
            },
            payload={"text": "Example document"}
        )
    ]
)
```
