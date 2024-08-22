---
title: Ollama
weight: 2600
---

# Using Ollama with Qdrant 

Ollama provides specialized embeddings for niche applications. Ollama supports a variety of embedding models, making it possible to build retrieval augmented generation (RAG) applications that combine text prompts with existing documents or other data in specialized areas.



## Installation

You can install the required package using the following pip command:

```bash
pip install ollama
```
## Integration Example


```python
import qdrant_client
from qdrant_client.models import Batch
from ollama import Ollama

# Initialize Ollama model
model = Ollama("ollama-unique")

# Generate embeddings for niche applications
text = "Ollama excels in niche applications with specific embeddings."
embeddings = model.embed(text)

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="NicheApplications",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)

```

