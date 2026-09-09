```python
from qdrant_client.context_headers import headers

cohere_api_key = os.getenv("COHERE_API_KEY")

with headers({"cohere-api-key": cohere_api_key}):
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            models.PointStruct(
                id=idx,
                vector={
                    "text": models.Document(
                        text=doc["caption"],
                        model="cohere/embed-v4.0",
                        options={"output_dimension": 512},
                    ),
                    "image": models.Image(
                        image=image_to_base64_url(doc["image"]),
                        model="cohere/embed-v4.0",
                        options={"output_dimension": 512},
                    ),
                },
                payload=doc
            )
            for idx, doc in enumerate(documents)
        ]
    )
```
