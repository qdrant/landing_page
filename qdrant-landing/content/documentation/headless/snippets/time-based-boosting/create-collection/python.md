```python
collection_name = "amazon_sentiment_collection"
if not client.collection_exists(collection_name=collection_name):
    client.create_collection(
        collection_name=collection_name,
        vectors_config={
            "dense_vector": models.VectorParams(
                size=384, distance=models.Distance.COSINE
            )
        },
    )

```