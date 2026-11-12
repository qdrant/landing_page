```python
from fastembed import ImageEmbedding

image_model = ImageEmbedding("nomic-ai/nomic-embed-vision-v1.5")

client.create_collection(
    collection_name="{fastembed_image_collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

images = ["cats.jpg", "living-room.jpg"]

client.upsert(
    collection_name="{fastembed_image_collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector.tolist(), payload={"image": images[idx]})
        for idx, vector in enumerate(image_model.embed(images))
    ],
)

query_vector = list(model.embed(["search_query: What do cats look like?"]))[0]

hits = client.query_points(
    collection_name="{fastembed_image_collection_name}",
    query=query_vector.tolist(),
    limit=3,
).points
```
