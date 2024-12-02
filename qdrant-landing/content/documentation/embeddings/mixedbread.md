---
title: MixedBread
---

# Using MixedBread with Qdrant 

MixedBread is a unique provider offering embeddings across multiple domains. Their models are versatile for various search tasks when integrated with Qdrant. MixedBread is creating state-of-the-art models and tools that make search smarter, faster, and more relevant. Whether you're building a next-gen search engine or RAG (Retrieval Augmented Generation) systems, or whether you're enhancing your existing search solution, they've got the ingredients to make it happen.

## Installation

You can install the required package using the following pip command:

```bash
pip install mixedbread
```

## Integration Example

Below is an example of how to obtain embeddings using MixedBread's API and store them in a Qdrant collection:

```python
import qdrant_client
from qdrant_client.models import Batch
from mixedbread import MixedBreadModel

# Initialize MixedBread model
model = MixedBreadModel("mixedbread-variant")

# Generate embeddings
text = "MixedBread provides versatile embeddings for various domains."
embeddings = model.embed(text)

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="VersatileEmbeddings",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)

```
