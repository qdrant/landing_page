---
title: Multitenancy with Qdrant
short_description: "Set up multitenancy with Qdrant using payload-based partitioning to keep each user's data fully isolated in one collection."
description: "Configure multitenant retrieval with Qdrant and FastEmbed via payload-based partitioning, isolating per-user data in a single shared collection."
weight: 25
aliases:
  - /documentation/tutorials/llama-index-multitenancy/
  - /documentation/examples/llama-index-multitenancy/
goal: Data & Filtering
stack:
  - Python
  - FastEmbed
---

# Multitenancy with Qdrant

If you are building a service that serves vectors for many independent users, and you want to isolate their
data, the best practice is to use a single collection with payload-based partitioning. This approach is
called **multitenancy**. Our guide on [Separate Partitions](/documentation/manage-data/multitenancy/) describes
how to set it up in general. This tutorial walks through a complete example in Python, using only the Qdrant
client and a local embedding model.

## Prerequisites

Install the Qdrant client and [FastEmbed](/documentation/fastembed/), which we'll use to generate embeddings
locally:

```bash
pip install qdrant-client fastembed
```

We are going to use a local Docker-based instance of Qdrant. If you want to use a remote instance, please
adjust the code accordingly. Here is how we can start a local instance:

```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

## Setting up the pipeline

We are going to implement an end-to-end example of a multitenant application. We'll be indexing the
documentation of different Python libraries, and we definitely don't want any users to see the results
coming from a library they are not interested in. In real case scenarios, this is even more dangerous,
as the documents may contain sensitive information.

Each library is a tenant, and every point stores the name of its library in a `library` payload field.

### Connecting to Qdrant and loading the embedding model

Any semantic search application requires a way to convert text into vectors: an embedding model. We'll use
[BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), which runs locally through FastEmbed
and produces 384-dimensional vectors. The model is downloaded the first time you use it.

```python
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

COLLECTION_NAME = "my_collection"

client = QdrantClient("http://localhost:6333")
embedding_model = TextEmbedding("BAAI/bge-small-en-v1.5")
```

### Defining a chunking strategy

Long documents don't fit into a single embedding, so they are usually split into overlapping chunks first.
A few lines of plain Python are enough for a fixed-length splitter. Both values are counted in words, and the
overlap keeps a sentence that falls on a chunk boundary from losing its context. Keep the chunk size small
enough for the embedding model: `bge-small-en-v1.5` truncates its input at 512 tokens.

```python
def chunk_text(text: str, chunk_size: int = 256, overlap: int = 32) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while words:
        chunks.append(" ".join(words[start : start + chunk_size]))
        if start + chunk_size >= len(words):
            break
        start += chunk_size - overlap
    return chunks
```

### Creating the collection

Since none of the search queries will be executed on the whole collection, we configure the collection for
multitenancy from the start. This is done for [performance reasons](/documentation/manage-data/multitenancy/#calibrate-performance):

- Setting `m=0` disables the global HNSW graph, and `payload_m=16` builds a separate graph for each tenant.
- A keyword [payload index](/documentation/manage-data/indexing/#payload-index) on `library` with
  `is_tenant=True` makes filtering efficient, and tells Qdrant to store the points of one tenant together. See
  [tenant index](/documentation/manage-data/indexing/#tenant-index).

**Do not change these parameters if you know there will be global search operations done on the collection.**

```python
client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(payload_m=16, m=0),
)

client.create_payload_index(
    collection_name=COLLECTION_NAME,
    field_name="library",
    field_schema=models.KeywordIndexParams(
        type=models.KeywordIndexType.KEYWORD,
        is_tenant=True,
    ),
)
```

<aside role="status">These steps are done just once, before you index your first documents!</aside>

## Indexing documents

No matter how our documents are generated, the flow is the same: split them into chunks, encode each chunk
with the embedding model, and store it in the collection. Let's define some documents manually. Each one has
a single metadata attribute: the name of the library it belongs to.

```python
documents = [
    {
        "text": "LlamaIndex is a simple, flexible data framework for connecting custom data sources to large language models.",
        "library": "llama-index",
    },
    {
        "text": "Qdrant is a vector search engine.",
        "library": "qdrant",
    },
]
```

Now we can chunk, embed, and upload them. The tenant name goes into the payload of every chunk, next to the
chunk text. We use `upload_points` rather than `upsert`, because it sends the points in batches and retries
failed requests:

```python
import uuid

chunks = []
for document in documents:
    for chunk in chunk_text(document["text"]):
        chunks.append({"text": chunk, "library": document["library"]})

vectors = embedding_model.embed([chunk["text"] for chunk in chunks])

client.upload_points(
    collection_name=COLLECTION_NAME,
    points=(
        models.PointStruct(
            id=str(uuid.uuid4()),
            vector=vector.tolist(),
            payload=chunk,
        )
        for chunk, vector in zip(chunks, vectors)
    ),
)
```

## Querying documents with constraints

Let's assume we are searching for some information about vector search, but are only allowed to
use Qdrant documentation. Every query embeds the question with the same model and adds a filter on the
`library` field, so only the points of one tenant are searched.

```python
def search(query: str, library: str, limit: int = 3):
    query_vector = next(iter(embedding_model.embed([query]))).tolist()
    return client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="library",
                    match=models.MatchValue(value=library),
                )
            ]
        ),
        limit=limit,
    ).points


for point in search("vector search", library="qdrant"):
    print(point.payload["text"], point.score)
# Output: Qdrant is a vector search engine.
```

The Qdrant description is the only document that belongs to the `qdrant` library, so it is the only
possible result. Now let's search for large language models, this time in the `llama-index` library:

```python
for point in search("large language models", library="llama-index"):
    print(point.payload["text"], point.score)
# Output: LlamaIndex is a simple, flexible data framework for connecting custom data sources to large language models.
```

Each search returned only the document from its own library, due to the different constraints, so we implemented
a real multitenant search application!
