```python
last_offset = None
batch_size = 100
reached_end = False

while not reached_end:
    records, last_offset = client.scroll(
        collection_name=COLLECTION,
        limit=batch_size,
        offset=last_offset,
        with_payload=True,
        with_vectors=False,
    )

    # Update only the new vector on each point; the old vector and payload are untouched
    client.update_vectors(
        collection_name=COLLECTION,
        points=[
            models.PointVectors(
                id=record.id,
                vector={
                    NEW_VECTOR: models.Document(
                        text=(record.payload or {}).get("text", ""),
                        model=NEW_MODEL,
                    )
                },
            )
            for record in records
        ],
    )

    reached_end = last_offset is None
```
