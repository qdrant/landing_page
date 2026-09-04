```python
with headers({"cohere-api-key": cohere_api_key}):
    payload = client.query_points(
        collection_name=COLLECTION_NAME,
        query=models.Document(
            text="Componenti di un aereo",
            model="cohere/embed-v4.0",
            options={"output_dimension": 512},
        ),
        using="image",
        with_payload=["image"],
        limit=1
    ).points[0].payload

Image.open(payload["image"])
```
