```python
def ingest(client: QdrantClient) -> None:
    points = []
    for meeting in MEETINGS:
        text = f"{meeting['topic']} ({meeting['date']}): {meeting['transcript']}"
        points.append(
            models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, meeting["topic"] + meeting["date"])),
                vector=models.Document(text=text, model=EMBEDDING_MODEL),
                payload=meeting,
            )
        )
    client.upsert(collection_name=COLLECTION, points=points)
```
