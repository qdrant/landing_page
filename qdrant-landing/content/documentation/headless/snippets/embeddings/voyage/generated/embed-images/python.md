```python
from PIL import Image

client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

image_inputs = [[Image.open("diagram.png")]]

image_response = vo.multimodal_embed(
    image_inputs,
    model="voyage-multimodal-3.5",
    input_type="document",
)

client.upsert(
    collection_name="{image_collection_name}",
    points=[models.PointStruct(id=0, vector=image_response.embeddings[0], payload={"image": "diagram.png"})],
)

query_inputs = [["How is Qdrant deployed?"]]

query_vector = vo.multimodal_embed(
    query_inputs, model="voyage-multimodal-3.5", input_type="query"
).embeddings[0]

hits = client.query_points(
    collection_name="{image_collection_name}",
    query=query_vector,
    limit=3,
).points
```
