```python
import os

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    cloud_inference=True,
)

import base64

def image_to_base64_url(image_path: str) -> str:
    prefix = "data:image/png;base64"
    with open(image_path, "rb") as image_file:
        return prefix + "," + base64.b64encode(image_file.read()).decode("utf-8")

documents = [
    {"caption": "An image about plane emergency safety.", "image": "images/image-1.png"},
    {"caption": "An image about airplane components.", "image": "images/image-2.png"},
    {"caption": "An image about COVID safety restrictions.", "image": "images/image-3.png"},
    {"caption": "A confidential image about UFO sightings.", "image": "images/image-4.png"},
    {"caption": "An image about unusual footprints on Aralar 2011.", "image": "images/image-5.png"},
]

COLLECTION_NAME = "multimodal-embeddings"

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "image": models.VectorParams(size=512, distance=models.Distance.COSINE),
            "text": models.VectorParams(size=512, distance=models.Distance.COSINE),
        }
    )

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

from PIL import Image

with headers({"cohere-api-key": cohere_api_key}):
    payload = client.query_points(
        collection_name=COLLECTION_NAME,
        query=models.Document(
            text="Plane components",
            model="cohere/embed-v4.0",
            options={"output_dimension": 512},
        ),
        using="image",
        with_payload=["image"],
        limit=1
    ).points[0].payload

Image.open(payload["image"])

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
