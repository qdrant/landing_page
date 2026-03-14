```python
from qdrant_client import QdrantClient, models

client.create_collection(
    collection_name=NEW_COLLECTION,
    vectors_config=(
        models.VectorParams(
            size=512,  # Size of the new embedding vectors
            distance=models.Distance.COSINE  # Similarity function for the new model
        )
    )
)

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

results = client.query_points(
    collection_name=OLD_COLLECTION,
    query=models.Document(text="my query", model=OLD_MODEL),
    limit=10,
)

results = client.query_points(
    collection_name=NEW_COLLECTION,
    query=models.Document(text="my query", model=NEW_MODEL),
    limit=10,
)
```
