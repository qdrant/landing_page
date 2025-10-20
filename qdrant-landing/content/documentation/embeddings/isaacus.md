---
title: Isaacus
aliases: [ ../integrations/Isaacus/ ]
---

# Isaacus

[Isaacus](https://isaacus.com/) provides state of the art foundational models for legal AI development. As of 20/10/2025, Isaacus' Kanon 2 Embedder is the best performing embedding model for legal retrieval, ranking top place in the [Massive Legal Embedding Benchmark](https://isaacus.com/blog/introducing-kanon-2-embedder).

There to get started with embedding documents with Kanon 2 Embedder and Qdrant, register an account with [Isaacus](https://isaacus.com/), initialise an API key and install the `isaacus` Python package.

```bash
pip install isaacus
```

### Setting up the Isaacus and Qdrant clients
Ensure you have the `isaacus` and `qdrant-client` packages installed then initialise both clients in python.

```python
from isaacus import Isaacus
import qdrant_client

isaacus_client = Isaacus(api_key="PASTE_YOUR_API_KEY_HERE")

client = qdrant_client.QdrantClient(":memory:")


```
The following example shows how to embed two terms of service documents with the `kanon 2 embdder`. This model generates sentence embeddings of size [1792](https://docs.isaacus.com/models/introduction). Documents are embedded using the `retrieval/document` task while queries are embedded using the `retrieval/query` task.

### Embedding documents

```python
# Fetch the terms of service documents from the URLs
terms = [isaacus_client.get(path="https://examples.isaacus.com/github-tos.md", cast_to=str), 
         isaacus_client.get(path="https://examples.isaacus.com/apple-tos.md", cast_to=str)]

# Use the Kanon 2 embedder model to create embeddings for the terms of services
embedding_model = "kanon-2-embedder"

# Create embeddings for the terms of service documents
document_response = isaacus_client.embeddings.create(
    model=embedding_model,
    texts=terms, # You can pass a single text or a list of texts here.
    task="retrieval/document",
)
```

### Converting the model outputs to Qdrant points

```python
from qdrant_client.models import PointStruct

points = [
    PointStruct(
        id=idx,
        vector=data.embedding,
        payload={"text": text[:50]}, # Store only the first 50 characters of the text for brevity
    )
    for idx, (data, text) in enumerate(zip(document_response.embeddings, terms))
]
```

### Creating a collection to insert the documents

```python
from qdrant_client.models import VectorParams, Distance

collection_name = "isaacus_collection"

client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=1792, # Size of the Kanon 2 embedding vector
        distance=Distance.COSINE,
    ),
)
client.upsert(collection_name, points)
```

## Searching for documents with Qdrant

Once the documents are indexed in the collection, you can search for the most relevant documents by embedding a query and using Qdrant's search capabilities. Queries are embedded using the same model but with the `retrieval/query` task.

```python
query_vec = isaacus_client.embeddings.create(
    model=embedding_model,
    texts=["What are GitHub's billing policies?"],
    task="retrieval/query",
).embeddings[0].embedding

resp = client.query_points(
    collection_name=collection_name,
    query=query_vec,     
)

for p in resp.points:
    print(p.id, p.score, p.payload)
```
