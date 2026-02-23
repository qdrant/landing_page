from qdrant_client import QdrantClient, models

# @hide-start
client = QdrantClient(
    url="",
    api_key=""
)

NEW_COLLECTION="new_collection"
OLD_COLLECTION="old_collection"

OLD_MODEL="sentence-transformers/all-minilm-l6-v2"
NEW_MODEL="qdrant/clip-vit-b-32-text"
# @hide-end

# @block-start create-new-collection
client.create_collection(
    collection_name=NEW_COLLECTION,
    vectors_config=(
        models.VectorParams(
            size=512,  # Size of the new embedding vectors
            distance=models.Distance.COSINE  # Similarity function for the new model
        )
    )
)
# @block-end create-new-collection

# @block-start upsert-old-collection
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
# @block-end upsert-old-collection

# @block-start upsert-new-collection
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
# @block-end upsert-new-collection

# @block-start migrate-points
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
    upsert_operations = [
        models.UpsertOperation(
            upsert=models.PointsList(
                points=[models.PointStruct(
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
                )],
                # Only insert the point if a point with this ID does not already exist.
                update_mode=models.UpdateMode.INSERT_ONLY
            )
        )
        for record in records
    ]

    # Upsert the re-embedded points into the new collection
    client.batch_update_points(
        collection_name=NEW_COLLECTION,
        update_operations=upsert_operations
    )

    # Check if we reached the end of the collection
    reached_end = (last_offset == None)
# @block-end migrate-points

# @block-start search-old-collection
results = client.query_points(
    collection_name=OLD_COLLECTION,
    query=models.Document(text="my query", model=OLD_MODEL),
    limit=10,
)
# @block-end search-old-collection

# @block-start search-new-collection
results = client.query_points(
    collection_name=NEW_COLLECTION,
    query=models.Document(text="my query", model=NEW_MODEL),
    limit=10,
)
# @block-end search-new-collection
