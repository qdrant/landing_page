```python
from fastembed import TextEmbedding, SparseTextEmbedding
from qdrant_client.models import PointStruct, SparseVector

DENSE_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
BM25_MODEL = "Qdrant/bm25"

dense_model = TextEmbedding(DENSE_MODEL)
bm25_model = SparseTextEmbedding(BM25_MODEL)


def dense(texts: list[str], query: bool = False) -> list[list[float]]:
    embeddings = dense_model.query_embed(texts) if query else dense_model.embed(texts)
    return [embedding.tolist() for embedding in embeddings]


def sparse(texts: list[str], query: bool = False) -> list[SparseVector]:
    embeddings = bm25_model.query_embed(texts) if query else bm25_model.embed(texts)
    return [
        SparseVector(indices=e.indices.tolist(), values=e.values.tolist())
        for e in embeddings
    ]
```
