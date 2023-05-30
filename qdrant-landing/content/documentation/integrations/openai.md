---
title: OpenAI
weight: 800
---

# OpenAI

Qdrant can also easily work with [OpenAI embeddings](https://beta.openai.com/docs/guides/embeddings/embeddings). There is an 
official OpenAI Python package that simplifies obtaining them, and it might be installed with pip:

```bash
pip install openai
```

Once installed, the package exposes the method allowing to retrieve the embedding for given text. OpenAI requires an API key
that has to be provided either as an environmental variable `OPENAI_API_KEY` or set in the source code directly, as 
presented below:

```python
import openai
import qdrant_client

from qdrant_client.http.models import Batch

# Provide OpenAI API key and choose one of the available models:
# https://beta.openai.com/docs/models/overview
openai.api_key = "<< your_api_key >>"
embedding_model = "text-embedding-ada-002"

response = openai.Embedding.create(
    input="The best vector database",
    model=embedding_model,
)

qdrant_client = qdrant_client.QdrantClient()
qdrant_client.upsert(
    collection_name="MyCollection",
    points=Batch(
        ids=[1],
        vectors=[response["data"][0]["embedding"]],
    )
)
```

