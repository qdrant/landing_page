# @block-start setup
import os

from openai import OpenAI
from qdrant_client import QdrantClient, models

upstage_client = OpenAI(
    api_key=os.environ["UPSTAGE_API_KEY"],
    base_url="https://api.upstage.ai/v1",
)
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector search engine.",
    "Upstage Solar Embedding models turn text into dense vectors.",
]

response = upstage_client.embeddings.create(
    model="solar-embedding-2-passage",
    input=documents,
)

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
# @block-end embed-documents

# @block-start embed-queries
query_vector = (
    upstage_client.embeddings.create(model="solar-embedding-2-query", input="What is Qdrant?")
    .data[0]
    .embedding
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
# @block-end embed-queries
