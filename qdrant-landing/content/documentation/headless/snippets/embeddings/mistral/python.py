# @block-start setup
from mistralai.client import Mistral
from qdrant_client import QdrantClient, models

mistral_client = Mistral()
client = QdrantClient(url="http://localhost:6333")

MODEL = "mistral-embed"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector search engine.",
    "Mistral embedding models turn text into dense vectors.",
]

response = mistral_client.embeddings.create(model=MODEL, inputs=documents)

points = []
for item in response.data:
    assert item.index is not None and item.embedding is not None
    points.append(
        models.PointStruct(
            id=item.index,
            vector=item.embedding,
            payload={"text": documents[item.index]},
        )
    )

client.upsert(collection_name="{collection_name}", points=points)
# @block-end embed-documents

# @block-start embed-queries
query_vector = (
    mistral_client.embeddings.create(model=MODEL, inputs=["What is Qdrant?"])
    .data[0]
    .embedding
)
assert query_vector is not None

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
# @block-end embed-queries

# @block-start reduce-vector-size
response = mistral_client.embeddings.create(
    model="codestral-embed",
    inputs=["def add(a, b):\n    return a + b"],
    output_dimension=512,
)
# @block-end reduce-vector-size
