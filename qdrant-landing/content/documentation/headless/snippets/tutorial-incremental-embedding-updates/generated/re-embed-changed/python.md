```python
def re_embed_changed(content_changed):
    if not content_changed:
        return
    client.upsert(COLLECTION,
        points=[
            models.PointStruct(
                id=c["point_id"],
                vector=models.Document(text=c["text"], model=MODEL),
                payload=payload(c),
            )
            for c in content_changed],
        wait=True)
```
