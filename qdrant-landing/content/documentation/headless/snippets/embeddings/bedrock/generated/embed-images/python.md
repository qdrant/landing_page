```python
import base64

NOVA_ID = "amazon.nova-2-multimodal-embeddings-v1:0"

def nova_embed(purpose: str, content: dict[str, object]) -> list[float]:
    body = {
        "taskType": "SINGLE_EMBEDDING",
        "singleEmbeddingParams": {
            "embeddingPurpose": purpose,
            "embeddingDimension": 1024,
            **content,
        },
    }
    response = bedrock.invoke_model(
        modelId=NOVA_ID, contentType="application/json", body=json.dumps(body)
    )
    return json.loads(response["body"].read())["embeddings"][0]["embedding"]

client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

with open("photo.jpg", "rb") as f:
    image = {"format": "jpeg", "source": {"bytes": base64.b64encode(f.read()).decode()}}

client.upsert(
    collection_name="{image_collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector=nova_embed("GENERIC_INDEX", {"image": image}),
            payload={"file": "photo.jpg"},
        )
    ],
)

image_hits = client.query_points(
    collection_name="{image_collection_name}",
    query=nova_embed(
        "IMAGE_RETRIEVAL",
        {"text": {"truncationMode": "END", "value": "A dog on a beach"}},
    ),
    limit=3,
).points
```
