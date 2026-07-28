```python
def as_points(chunks):
    points = []
    for c in chunks:
        points.append(models.PointStruct(
            id=c["point_id"],
            vector=models.Document(text=c["text"], model=MODEL),  # embedded by Qdrant Cloud Inference
            payload=payload(c),
        ))
    return points

client.upsert(MAIN, points=as_points(prepare(CHUNKS)), wait=True)
```
