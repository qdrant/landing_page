```python
from nomic import embed
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

MODEL = "nomic-embed-text-v1.5"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Nomic Embed models turn text into dense vectors.",
    "Paris is the capital of France.",
]

output = embed.text(texts=documents, model=MODEL, task_type="search_document")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": documents[idx]})
        for idx, vector in enumerate(output["embeddings"])
    ],
)

query_vector = embed.text(
    texts=["What is Qdrant?"],
    model=MODEL,
    task_type="search_query",
)["embeddings"][0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points

output = embed.text(
    texts=documents,
    model=MODEL,
    task_type="search_document",
    dimensionality=256,
)

client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

images = ["cats.jpg", "living-room.jpg"]

output = embed.image(images=images, model="nomic-embed-vision-v1.5")

client.upsert(
    collection_name="{image_collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"image": images[idx]})
        for idx, vector in enumerate(output["embeddings"])
    ],
)

query_vector = embed.text(
    texts=["What do cats look like?"],
    model=MODEL,
    task_type="search_query",
)["embeddings"][0]

hits = client.query_points(
    collection_name="{image_collection_name}",
    query=query_vector,
    limit=3,
).points

from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")
model = TextEmbedding("nomic-ai/nomic-embed-text-v1.5")

client.create_collection(
    collection_name="{fastembed_collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Nomic Embed models turn text into dense vectors.",
    "Paris is the capital of France.",
]

client.upsert(
    collection_name="{fastembed_collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector.tolist(), payload={"text": documents[idx]})
        for idx, vector in enumerate(model.embed([f"search_document: {doc}" for doc in documents]))
    ],
)

query_vector = list(model.embed(["search_query: What is Qdrant?"]))[0]

hits = client.query_points(
    collection_name="{fastembed_collection_name}",
    query=query_vector.tolist(),
    limit=3,
).points

import numpy as np

def shorten(vector: np.ndarray, size: int) -> list[float]:
    vector = (vector - vector.mean()) / np.sqrt(vector.var() + 1e-5)
    vector = vector[:size]
    return (vector / np.linalg.norm(vector)).tolist()

query_vector_256 = shorten(query_vector, 256)

from fastembed import ImageEmbedding

image_model = ImageEmbedding("nomic-ai/nomic-embed-vision-v1.5")

client.create_collection(
    collection_name="{fastembed_image_collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

images = ["cats.jpg", "living-room.jpg"]

client.upsert(
    collection_name="{fastembed_image_collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector.tolist(), payload={"image": images[idx]})
        for idx, vector in enumerate(image_model.embed(images))
    ],
)

query_vector = list(model.embed(["search_query: What do cats look like?"]))[0]

hits = client.query_points(
    collection_name="{fastembed_image_collection_name}",
    query=query_vector.tolist(),
    limit=3,
).points
```
