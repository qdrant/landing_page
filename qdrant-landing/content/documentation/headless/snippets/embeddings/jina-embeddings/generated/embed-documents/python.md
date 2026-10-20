```python
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Jina AI embedding models turn text, images, and video into dense vectors.",
]

data = jina_embed(model=MODEL, task="retrieval.passage", input=documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=item["index"],
            vector=item["embedding"],
            payload={"text": documents[item["index"]]},
        )
        for item in data
    ],
)
```
