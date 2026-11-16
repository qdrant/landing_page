```python
import base64

VL_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2"

client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=2048, distance=models.Distance.COSINE),
)

with open("chart.png", "rb") as f:
    image_url = "data:image/png;base64," + base64.b64encode(f.read()).decode()

image_response = nvidia.embeddings.create(
    model=VL_MODEL,
    input=[image_url],
    encoding_format="float",
    extra_body={"modality": ["image"], "input_type": "passage"},
)

client.upsert(
    collection_name="{image_collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector=image_response.data[0].embedding,
            payload={"file": "chart.png"},
        )
    ],
)

text_response = nvidia.embeddings.create(
    model=VL_MODEL,
    input=["Which region had the highest revenue?"],
    encoding_format="float",
    extra_body={"modality": ["text"], "input_type": "query"},
)

image_hits = client.query_points(
    collection_name="{image_collection_name}",
    query=text_response.data[0].embedding,
    limit=3,
).points
```
