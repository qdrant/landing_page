# @block-start setup
import json

import boto3
from qdrant_client import QdrantClient, models

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
client = QdrantClient(url="http://localhost:6333")

MODEL_ID = "amazon.titan-embed-text-v2:0"

def embed(text: str) -> list[float]:
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        body=json.dumps({"inputText": text, "dimensions": 1024, "normalize": True}),
    )
    return json.loads(response["body"].read())["embedding"]

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector search engine.",
    "Amazon Bedrock serves embedding models through the AWS SDKs.",
]

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=embed(doc), payload={"text": doc})
        for idx, doc in enumerate(documents)
    ],
)
# @block-end embed-documents

# @block-start embed-queries
hits = client.query_points(
    collection_name="{collection_name}",
    query=embed("What is Qdrant?"),
    limit=3,
).points
# @block-end embed-queries

# @block-start embed-images
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
# @block-end embed-images
