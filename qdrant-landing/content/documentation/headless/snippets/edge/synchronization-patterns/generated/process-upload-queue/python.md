```python
BATCH_SIZE = 10
points_to_upload: list[models.PointStruct] = []

while len(points_to_upload) < BATCH_SIZE:
    try:
        points_to_upload.append(upload_queue.get_nowait())
    except Empty:
        break

if points_to_upload:
    server_client.upsert(
        collection_name=COLLECTION_NAME, points=points_to_upload
    )
```
