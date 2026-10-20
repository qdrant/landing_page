```python
from qdrant_client import QdrantClient, models
from sie_qdrant import SIEVectorizer

MODEL = "BAAI/bge-m3"

vectorizer = SIEVectorizer(base_url="http://localhost:8080", model=MODEL)
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector database and similarity search engine.",
    "SIE serves open embedding models from one endpoint.",
]

vectors = vectorizer.embed_documents(documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": documents[idx]})
        for idx, vector in enumerate(vectors)
    ],
)

query_vector = vectorizer.embed_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points

from sie_qdrant import SIENamedVectorizer

hybrid_vectorizer = SIENamedVectorizer(
    base_url="http://localhost:8080",
    model="BAAI/bge-m3",
    output_types=["dense", "sparse"],
)

client.create_collection(
    collection_name="{hybrid_collection_name}",
    vectors_config={"dense": models.VectorParams(size=1024, distance=models.Distance.COSINE)},
    sparse_vectors_config={"sparse": models.SparseVectorParams()},
)

named_vectors = hybrid_vectorizer.embed_documents(documents)

client.upsert(
    collection_name="{hybrid_collection_name}",
    points=[
        models.PointStruct(
            id=idx,
            vector={
                "dense": named["dense"],
                "sparse": models.SparseVector(**named["sparse"]),
            },
            payload={"text": documents[idx]},
        )
        for idx, named in enumerate(named_vectors)
    ],
)

query = hybrid_vectorizer.embed_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{hybrid_collection_name}",
    prefetch=[
        models.Prefetch(query=query["dense"], using="dense", limit=20),
        models.Prefetch(query=models.SparseVector(**query["sparse"]), using="sparse", limit=20),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=3,
).points

colbert_vectorizer = SIENamedVectorizer(
    base_url="http://localhost:8080",
    model="jinaai/jina-colbert-v2",
    output_types=["multivector"],
)

client.create_collection(
    collection_name="{colbert_collection_name}",
    vectors_config={
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
        ),
    },
)

client.upsert(
    collection_name="{colbert_collection_name}",
    points=[
        models.PointStruct(
            id=idx,
            vector={"colbert": named["multivector"]},
            payload={"text": documents[idx]},
        )
        for idx, named in enumerate(colbert_vectorizer.embed_documents(documents))
    ],
)

query = colbert_vectorizer.embed_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{colbert_collection_name}",
    query=query["multivector"],
    using="colbert",
    limit=3,
).points
```
