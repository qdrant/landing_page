```python
client.upsert(
    collection_name=NEW_COLLECTION,
    points=[
        models.PointStruct(
            id=1,
            # Use the new embedding model to encode the document
            vector=models.Document(
                text="Example document",
                model=NEW_MODEL,
            ),
            payload={"text": "Example document"}
        )
    ]
)
```
