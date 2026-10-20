# @block-start setup
import ollama
from qdrant_client import QdrantClient, models

ollama_client = ollama.Client()
client = QdrantClient(url="http://localhost:6333")

MODEL = "qwen3-embedding:0.6b"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Ollama runs open models on your own hardware.",
]

response = ollama_client.embed(model=MODEL, input=documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=list(vector), payload={"text": documents[idx]})
        for idx, vector in enumerate(response.embeddings)
    ],
)
# @block-end embed-documents

# @block-start embed-queries
TASK = "Given a web search query, retrieve relevant passages that answer the query"

query_vector = ollama_client.embed(
    model=MODEL,
    input=f"Instruct: {TASK}\nQuery:What is Qdrant?",
).embeddings[0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=list(query_vector),
    limit=3,
).points
# @block-end embed-queries

# @block-start reduce-vector-size
response = ollama_client.embed(model=MODEL, input=documents, dimensions=256)
# @block-end reduce-vector-size
