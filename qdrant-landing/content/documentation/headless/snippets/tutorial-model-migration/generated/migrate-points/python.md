```python
last_offset = None
batch_size = 100  # Number of points to read in each batch
reached_end = False

while not reached_end:
    # Get the next batch of points from the old collection
    records, last_offset = client.scroll(
        collection_name=OLD_COLLECTION,
        limit=batch_size,
        offset=last_offset,
        # Include payloads in the response, as we need them to re-embed the vectors
        with_payload=True,
        # We don't need the old vectors, so let's save on the bandwidth
        with_vectors=False,
    )

    # Re-embed the points using the new model
    points = [
        models.PointStruct(
            # Keep the original ID to ensure consistency
            id=record.id,
            # Use the new embedding model to encode the text from the payload,
            # assuming that was the original source of the embedding
            vector=models.Document(
                text=(record.payload or {}).get("text", ""),
                model=NEW_MODEL,
            ),
            # Keep the original payload
            payload=record.payload
        )
        for record in records
    ]

    # Upsert the re-embedded points into the new collection
    client.upsert(
        collection_name=NEW_COLLECTION,
        points=points,
        # Only insert the point if a point with this ID does not already exist.
        update_mode=models.UpdateMode.INSERT_ONLY
    )

    # Check if we reached the end of the collection
    reached_end = (last_offset == None)
```
