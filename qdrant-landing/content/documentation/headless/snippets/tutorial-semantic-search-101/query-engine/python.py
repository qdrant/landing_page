hits = client.query_points(
    collection_name=COLLECTION_NAME,
    query=models.Document(
        text="alien invasion",
        model=EMBEDDING_MODEL
    ),
    limit=3,
).points

for hit in hits:
    print(hit.payload, "score:", hit.score)
