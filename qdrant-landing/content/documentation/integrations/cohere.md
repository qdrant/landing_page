---
title: Cohere
weight: 50
---

# Cohere

Qdrant is compatible with Cohere [co.embed API](https://docs.cohere.ai/reference/embed) and it's official Python SDK that
might be installed as any other package:

```bash
pip install cohere
```

The embeddings returned by co.embed API might be used directly in the Qdrant client's calls:

```python
import cohere
import qdrant_client

from qdrant_client.http.models import Batch

cohere_client = cohere.Client("<< your_api_key >>")
qdrant_client = qdrant_client.QdrantClient()
qdrant_client.upsert(
    collection_name="MyCollection",
    points=Batch(
        ids=[1],
        vectors=cohere_client.embed(
            model="large",
            texts=["The best vector database"],
        ).embeddings,
    )
)
```

If you are interested in seeing an end-to-end project created with co.embed API and Qdrant, please check out the
"[Question Answering as a Service with Cohere and Qdrant](https://qdrant.tech/articles/qa-with-cohere-and-qdrant/)" article.