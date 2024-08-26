---
title: GPT4All
weight: 1700
---

# Using GPT4All with Qdrant 

GPT4All offers a range of large language models that can be fine-tuned for various applications. GPT4All runs large language models (LLMs) privately on everyday desktops & laptops.

No API calls or GPUs required - you can just download the application and get started. Use GPT4All in Python to program with LLMs implemented with the llama.cpp backend and Nomic's C backend.

## Installation

You can install the required package using the following pip command:

```bash
pip install gpt4all
```

Here is how you might connect to GPT4ALL using Qdrant:

```python
import qdrant_client
from qdrant_client.models import Batch
from gpt4all import GPT4All

# Initialize GPT4All model
model = GPT4All("gpt4all-lora-quantized")

# Generate embeddings for a text
text = "GPT4All enables open-source AI applications."
embeddings = model.embed(text)

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="OpenSourceAI",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)

```

