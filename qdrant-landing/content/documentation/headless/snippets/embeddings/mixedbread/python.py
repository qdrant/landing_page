# @block-start setup
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("mixedbread-ai/mxbai-embed-large-v1")
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Mixedbread publishes open-weight embedding models on Hugging Face.",
]

embeddings = model.encode_document(documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=idx,
            vector=embedding.tolist(),
            payload={"text": documents[idx]},
        )
        for idx, embedding in enumerate(embeddings)
    ],
)
# @block-end embed-documents

# @block-start embed-queries
query_vector = model.encode_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector.tolist(),
    limit=3,
).points
# @block-end embed-queries

# @block-start reduce-vector-size
small_model = SentenceTransformer("mixedbread-ai/mxbai-embed-large-v1", truncate_dim=512)
# @block-end reduce-vector-size

# @block-start mixedbread-api-legacy
from mixedbread import Mixedbread

mxbai = Mixedbread()

document_result = mxbai.embed(model="mixedbread-ai/mxbai-embed-large-v1", input=documents)
query_result = mxbai.embed(
    model="mixedbread-ai/mxbai-embed-large-v1",
    input="Represent this sentence for searching relevant passages: What is Qdrant?",
)
# @block-end mixedbread-api-legacy
