# @block-start setup
import cohere
from qdrant_client import QdrantClient, models

co = cohere.ClientV2()
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=2048, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector search engine.",
    "Cohere Embed models turn text and images into dense vectors.",
]

response = co.embed(
    model="embed-v5.0-pro",
    input_type="search_document",
    texts=documents,
    embedding_types=["float"],
)
vectors = response.embeddings.float_
assert vectors is not None

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": text})
        for idx, (vector, text) in enumerate(zip(vectors, documents))
    ],
)
# @block-end embed-documents

# @block-start embed-queries
response = co.embed(
    model="embed-v5.0-fast",
    input_type="search_query",
    texts=["What is Qdrant?"],
    embedding_types=["float"],
)
query_vectors = response.embeddings.float_
assert query_vectors is not None

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vectors[0],
    limit=3,
).points
# @block-end embed-queries

# @block-start embed-images
import base64

with open("diagram.png", "rb") as f:
    image_url = "data:image/png;base64," + base64.b64encode(f.read()).decode()

response = co.embed(
    model="embed-v5.0-pro",
    input_type="search_document",
    images=[image_url],
    embedding_types=["float"],
)
image_vectors = response.embeddings.float_
assert image_vectors is not None

client.upsert(
    collection_name="{collection_name}",
    points=[models.PointStruct(id=2, vector=image_vectors[0], payload={"image": "diagram.png"})],
)
# @block-end embed-images

# @block-start reduce-vector-size
response = co.embed(
    model="embed-v5.0-pro",
    input_type="search_document",
    texts=documents,
    output_dimension=512,
    embedding_types=["float"],
)
# @block-end reduce-vector-size
