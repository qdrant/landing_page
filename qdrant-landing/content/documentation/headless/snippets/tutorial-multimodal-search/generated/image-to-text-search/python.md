```python
with headers({"cohere-api-key": cohere_api_key}):
    payload = client.query_points(
        collection_name=COLLECTION_NAME,
        query=models.Image(
            image=image_to_base64_url("images/image-2.png"),
            model="cohere/embed-v4.0",
            options={"output_dimension": 512},
        ),
        using="text",
        with_payload=["caption"],
        limit=1
    ).points[0].payload

print(payload["caption"])
```
