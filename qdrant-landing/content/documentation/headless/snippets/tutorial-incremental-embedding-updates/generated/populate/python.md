```python
client.upsert(COLLECTION, points=[
    models.PointStruct(
        id=c["point_id"],
        vector=models.Document(text=c["text"], model=MODEL),
        payload=payload(c),
    )
    for c in prepare_chunks_for_sync(CHUNKS)
], wait=True)
```
