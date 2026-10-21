```python
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")
model = TextEmbedding("nomic-ai/nomic-embed-text-v1.5")

client.create_collection(
    collection_name="{fastembed_collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector search engine.",
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
```
