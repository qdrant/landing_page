```python
import base64

with open("diagram.png", "rb") as f:
    image_url = "data:image/png;base64," + base64.b64encode(f.read()).decode()

response = co.embed(
    model="embed-v5.0-pro",
    input_type="search_document",
    images=[image_url],
    embedding_types=["float"],
)
image_vectors = response.embeddings.float_
assert image_vectors is not None

client.upsert(
    collection_name="{collection_name}",
    points=[models.PointStruct(id=2, vector=image_vectors[0], payload={"image": "diagram.png"})],
)
```
