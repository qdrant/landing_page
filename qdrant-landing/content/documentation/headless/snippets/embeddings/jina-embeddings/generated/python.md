```python
import os
from typing import Any

import requests
from qdrant_client import QdrantClient, models

JINA_URL = "https://api.jina.ai/v1/embeddings"
MODEL = "jina-embeddings-v5-text-small"

def jina_embed(**body: Any) -> list[dict[str, Any]]:
    response = requests.post(
        JINA_URL,
        headers={"Authorization": f"Bearer {os.environ['JINA_API_KEY']}"},
        json=body,
    )
    response.raise_for_status()
    return response.json()["data"]

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Jina AI embedding models turn text, images, and video into dense vectors.",
]

data = jina_embed(model=MODEL, task="retrieval.passage", input=documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=item["index"],
            vector=item["embedding"],
            payload={"text": documents[item["index"]]},
        )
        for item in data
    ],
)

query_vector = jina_embed(model=MODEL, task="retrieval.query", input=["What is Qdrant?"])[0][
    "embedding"
]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points

reduced = jina_embed(model=MODEL, task="retrieval.passage", input=documents, dimensions=256)

images = [
    "https://i.ibb.co/nQNGqL0/beach1.jpg",
    "https://i.ibb.co/r5w8hG8/beach2.jpg",
]

image_data = jina_embed(
    model="jina-embeddings-v5-omni-small",
    task="retrieval.passage",
    input=[{"image": url} for url in images],
)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=100 + item["index"],
            vector=item["embedding"],
            payload={"image": images[item["index"]]},
        )
        for item in image_data
    ],
)

client.create_collection(
    collection_name="{colbert_collection_name}",
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        multivector_config=models.MultiVectorConfig(
            comparator=models.MultiVectorComparator.MAX_SIM
        ),
    ),
)

colbert_data = jina_embed(model="jina-colbert-v2", input_type="document", input=documents)

client.upsert(
    collection_name="{colbert_collection_name}",
    points=[
        models.PointStruct(
            id=item["index"],
            vector=item["embeddings"],
            payload={"text": documents[item["index"]]},
        )
        for item in colbert_data
    ],
)

colbert_query = jina_embed(model="jina-colbert-v2", input_type="query", input=["What is Qdrant?"])

colbert_hits = client.query_points(
    collection_name="{colbert_collection_name}",
    query=colbert_query[0]["embeddings"],
    limit=3,
).points
```
