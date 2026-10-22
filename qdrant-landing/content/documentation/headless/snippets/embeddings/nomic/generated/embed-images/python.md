```python
client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

images = ["cats.jpg", "living-room.jpg"]

output = embed.image(images=images, model="nomic-embed-vision-v1.5")

client.upsert(
    collection_name="{image_collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"image": images[idx]})
        for idx, vector in enumerate(output["embeddings"])
    ],
)

query_vector = embed.text(
    texts=["What do cats look like?"],
    model=MODEL,
    task_type="search_query",
)["embeddings"][0]

hits = client.query_points(
    collection_name="{image_collection_name}",
    query=query_vector,
    limit=3,
).points
```
