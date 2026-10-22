```python
from openai import OpenAI
from qdrant_client import QdrantClient, models

openai_client = OpenAI()
client = QdrantClient(url="http://localhost:6333")

MODEL = "text-embedding-3-small"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector search engine.",
    "OpenAI embedding models turn text into dense vectors.",
]

response = openai_client.embeddings.create(model=MODEL, input=documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=item.index,
            vector=item.embedding,
            payload={"text": documents[item.index]},
        )
        for item in response.data
    ],
)

query_vector = (
    openai_client.embeddings.create(model=MODEL, input="What is Qdrant?")
    .data[0]
    .embedding
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points

response = openai_client.embeddings.create(
    model="text-embedding-3-large",
    input=documents,
    dimensions=1024,
)
```
