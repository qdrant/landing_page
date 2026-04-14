---
title: Superlinked
---

# Superlinked

[Superlinked](https://superlinked.com) is a self-hosted inference engine (SIE) that serves 85+ embedding models (dense, sparse, and multivector / ColBERT) from a single endpoint. The `sie-qdrant` package lets you use SIE as the embedding provider for Qdrant collections. SIE encodes your text into vectors, and you store and search them in Qdrant.

> `sie-qdrant` is currently Python only. TypeScript support is not yet available.

## Installation

```bash
pip install sie-qdrant
```

This installs `sie-sdk` and `qdrant-client` (v1.7+) as dependencies. You also need a running SIE instance; see the [Superlinked quickstart](https://superlinked.com/docs) for deployment options (Docker, GPU).

## Vectorizer

`SIEVectorizer` calls SIE and returns dense vectors as `list[float]`, ready to pass into Qdrant's `PointStruct(vector=...)` and `query_points()`:

```python
from sie_qdrant import SIEVectorizer

vectorizer = SIEVectorizer(
    base_url="http://localhost:8080",
    model="NovaSearch/stella_en_400M_v5",
)
```

Any model SIE supports for dense embeddings works, just change the `model` parameter:

```python
# Nomic MoE (768-dim, multilingual)
vectorizer = SIEVectorizer(model="nomic-ai/nomic-embed-text-v2-moe")

# E5 (1024-dim, instruction-tuned - SIE handles query vs document encoding automatically)
vectorizer = SIEVectorizer(model="intfloat/e5-large-v2")

# BGE-M3 (1024-dim, also supports sparse output for hybrid search)
vectorizer = SIEVectorizer(model="BAAI/bge-m3")
```

See the [Model Catalog](https://superlinked.com/models) for all supported models.

## Full example

Create a Qdrant collection, embed documents with SIE, and search:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sie_qdrant import SIEVectorizer

vectorizer = SIEVectorizer(
    base_url="http://localhost:8080",
    model="NovaSearch/stella_en_400M_v5",
)

client = QdrantClient("http://localhost:6333")

client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
)

texts = [
    "Machine learning is a subset of artificial intelligence.",
    "Neural networks are inspired by biological neurons.",
    "Deep learning uses multiple layers of neural networks.",
    "Python is popular for machine learning development.",
]

vectors = vectorizer.embed_documents(texts)

client.upsert(
    collection_name="documents",
    points=[
        PointStruct(id=i, vector=v, payload={"text": t})
        for i, (t, v) in enumerate(zip(texts, vectors))
    ],
)

query_vec = vectorizer.embed_query("What is deep learning?")

results = client.query_points(
    collection_name="documents",
    query=query_vec,
    limit=2,
)

for point in results.points:
    print(point.payload["text"])
```

## Named vectors (dense + sparse)

For hybrid search, `SIENamedVectorizer` produces multiple vector types in a single SIE call. The model must support all requested output types: `BAAI/bge-m3` supports both dense and sparse, `jinaai/jina-colbert-v2` supports dense and multivector.

SIE sparse vectors (from SPLADE or BGE-M3) are learned sparse representations that capture semantic similarity, not just term overlap. Qdrant stores them natively in its compact `indices + values` format.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    SparseVectorParams, SparseVector,
)
from sie_qdrant import SIENamedVectorizer

# One SIE call produces both dense and sparse vectors
vectorizer = SIENamedVectorizer(
    base_url="http://localhost:8080",
    model="BAAI/bge-m3",
    output_types=["dense", "sparse"],
)

client = QdrantClient("http://localhost:6333")

client.create_collection(
    collection_name="documents",
    vectors_config={"dense": VectorParams(size=1024, distance=Distance.COSINE)},
    sparse_vectors_config={"sparse": SparseVectorParams()},
)

texts = ["First document", "Second document"]
named_vectors = vectorizer.embed_documents(texts)

client.upsert(
    collection_name="documents",
    points=[
        PointStruct(
            id=i,
            vector={
                "dense": v["dense"],
                "sparse": SparseVector(**v["sparse"]),
            },
            payload={"text": t},
        )
        for i, (t, v) in enumerate(zip(texts, named_vectors))
    ],
)
```

### Hybrid search with Reciprocal Rank Fusion

Combine dense and sparse results via Qdrant's prefetch + RRF fusion:

```python
from qdrant_client.models import Prefetch, FusionQuery, Fusion, SparseVector

query = vectorizer.embed_query("search text")

results = client.query_points(
    collection_name="documents",
    prefetch=[
        Prefetch(query=query["dense"], using="dense", limit=20),
        Prefetch(query=SparseVector(**query["sparse"]), using="sparse", limit=20),
    ],
    query=FusionQuery(fusion=Fusion.RRF),
    limit=5,
)
```

## Multivector (ColBERT) and late interaction

Qdrant supports native MaxSim retrieval for ColBERT-style late-interaction models via `MultiVectorConfig`. Combined with `SIENamedVectorizer`, this enables true late-interaction retrieval without client-side scoring:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    MultiVectorConfig, MultiVectorComparator,
)
from sie_qdrant import SIENamedVectorizer

vectorizer = SIENamedVectorizer(
    base_url="http://localhost:8080",
    model="jinaai/jina-colbert-v2",
    output_types=["dense", "multivector"],
)

client = QdrantClient("http://localhost:6333")
client.create_collection(
    collection_name="documents",
    vectors_config={
        "dense": VectorParams(size=768, distance=Distance.COSINE),
        "multivector": VectorParams(
            size=128,
            distance=Distance.COSINE,
            multivector_config=MultiVectorConfig(
                comparator=MultiVectorComparator.MAX_SIM,
            ),
        ),
    },
)

texts = ["First document", "Second document"]
named_vectors = vectorizer.embed_documents(texts)

client.upsert(
    collection_name="documents",
    points=[
        PointStruct(
            id=i,
            vector={"dense": v["dense"], "multivector": v["multivector"]},
            payload={"text": t},
        )
        for i, (t, v) in enumerate(zip(texts, named_vectors))
    ],
)

query = vectorizer.embed_query("search text")
results = client.query_points(
    collection_name="documents",
    query=query["multivector"],
    using="multivector",
    limit=5,
)
```

## Configuration

| Parameter | Type | Default | Description |
|---|---|---|---|
| `base_url` | `str` | `http://localhost:8080` | SIE server URL |
| `model` | `str` | `BAAI/bge-m3` | Model to use for embeddings ([catalog](https://superlinked.com/models)) |
| `instruction` | `str` | `None` | Instruction prefix for instruction-tuned models (e.g. E5) |
| `output_dtype` | `str` | `None` | Output dtype: `float32`, `float16`, `int8`, `binary` |
| `gpu` | `str` | `None` | Target GPU type for routing |
| `options` | `dict` | `None` | Model-specific options |
| `timeout_s` | `float` | `180.0` | Request timeout in seconds |

## Further reading

- [Superlinked docs](https://superlinked.com/docs)
- [`sie-qdrant` on PyPI](https://pypi.org/project/sie-qdrant/)
- [Superlinked on GitHub](https://github.com/superlinked/sie)
