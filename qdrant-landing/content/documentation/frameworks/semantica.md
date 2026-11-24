---
title: Semantica
short_description: "Use Qdrant as the vector store backend in Semantica to add scalable, persistent semantic search to context graphs and decision intelligence pipelines."
description: "Configure Semantica's QdrantStore to back its vector store layer with Qdrant, enabling scalable similarity search over agent decisions, knowledge graph entities, and document embeddings."
---

# Semantica

[Semantica](https://github.com/semantica-agi/semantica) is a Python library for building context graphs, decision intelligence pipelines, and knowledge graphs with full provenance. Its vector store layer is backend-agnostic: swapping in Qdrant gives you a persistent, scalable store for similarity search over agent decisions, document embeddings, and knowledge graph entities.

## Installation

Install Semantica with the Qdrant extra:

```bash
pip install "semantica[vectorstore-qdrant]"
```

## Usage

`QdrantStore` is the direct Qdrant backend class. Call `connect()` first to establish the connection, then `create_collection()` before inserting or searching.

```python
import os
import numpy as np
from semantica.vector_store import QdrantStore

store = QdrantStore(
    url=os.environ.get("QDRANT_URL"),
    api_key=os.environ.get("QDRANT_API_KEY"),  # omit for a local instance
)
store.connect()

# Create a collection — vector_size must match your embedding dimension
store.create_collection(
    collection_name="documents",
    vector_size=4,
    distance="Cosine",
)

# Insert vectors with metadata payloads
vectors = [
    np.array([0.1, 0.2, 0.3, 0.4]),
    np.array([0.9, 0.8, 0.7, 0.6]),
]
store.insert_vectors(
    vectors=vectors,
    ids=[1, 2],
    payloads=[
        {"text": "Qdrant is a vector database."},
        {"text": "Semantica adds structured context to AI agents."},
    ],
)

# Similarity search
results = store.search_vectors(
    query_vector=np.array([0.1, 0.2, 0.3, 0.4]),
    limit=2,
)
for r in results:
    print(r["score"], r["metadata"]["text"])
```

For a local Qdrant instance, omit `api_key` and set `url` to `"http://localhost:6333"`.

`create_collection()` will raise if the collection already exists. Drop the collection first if you need to re-run the example against the same Qdrant instance.

## Further Reading

- [Semantica Documentation](https://docs.getsemantica.ai)
- [Source Code](https://github.com/semantica-agi/semantica/blob/main/semantica/vector_store/qdrant_store.py)
