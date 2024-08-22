---
title: Instruct
weight: 1800 
---

# Using Instruct with Qdrant 

Instruct is a specialized provider offering detailed embeddings for instructional content, which can be effectively used with Qdrant. With Instruct every text input is embedded together with instructions explaining the use case (e.g., task and domain descriptions). Unlike encoders from prior work that are more specialized, INSTRUCTOR is a single embedder that can generate text embeddings tailored to different downstream tasks and domains, without any further training. 

## Installation

```bash
pip install instruct
```

Below is an example of how to obtain embeddings using Instruct's API and store them in a Qdrant collection:

```python
import qdrant_client
from qdrant_client.models import Batch
from instruct import Instruct

# Initialize Instruct model
model = Instruct("instruct-base")

# Generate embeddings for instructional content
text = "Instruct provides detailed embeddings for learning content."
embeddings = model.embed(text)

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="LearningContent",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)

```
