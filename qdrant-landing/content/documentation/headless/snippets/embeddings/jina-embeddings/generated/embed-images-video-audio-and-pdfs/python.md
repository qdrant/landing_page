```python
images = [
    "https://i.ibb.co/nQNGqL0/beach1.jpg",
    "https://i.ibb.co/r5w8hG8/beach2.jpg",
]

image_data = jina_embed(
    model="jina-embeddings-v5-omni-small",
    task="retrieval.passage",
    input=[{"image": url} for url in images],
)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=100 + item["index"],
            vector=item["embedding"],
            payload={"image": images[item["index"]]},
        )
        for item in image_data
    ],
)
```
