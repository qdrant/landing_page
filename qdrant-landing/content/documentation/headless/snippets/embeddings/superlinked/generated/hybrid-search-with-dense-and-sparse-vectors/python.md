```python
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
```
