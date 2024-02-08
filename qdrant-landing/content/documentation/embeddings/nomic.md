---
title: "Nomic"
weight: 1100
---

# Nomic

The `nomic-embed-text-v1` model is an [open source](https://github.com/nomic-ai/contrastors) 8192 context length text encoder.
It is available on [Hugging Face Hub](https://huggingface.co/nomic-ai/nomic-embed-text-v1), but the easiest way to use it is 
through the [Nomic Text Embeddings](https://docs.nomic.ai/reference/endpoints/nomic-embed-text), either by using the official
Python client or by sending HTTP requests directly.

Nomic embeddings might be used directly in the Qdrant client's calls. Please note there is a difference in the way the embeddings
are obtained for the documents and queries. The `task_type` parameter defines what kind of embeddings you want to obtain.
For the documents, it should be set to `search_document`:

```python
from qdrant_client import QdrantClient, models
from nomic import embed

output = embed.text(
    texts=["The best vector database"],
    model="nomic-embed-text-v1",
    task_type="search_document",
)

qdrant_client = QdrantClient()
qdrant_client.upsert(
    collection_name="my-collection",
    points=models.Batch(
        ids=[1, 2],
        vectors=output["embeddings"],
    ),
)
```

While querying the collection, the `task_type` should be set to `search_query`:

```python
output = embed.text(
    texts=["The best vector database"],
    model="nomic-embed-text-v1",
    task_type="search_query",
)

qdrant_client.search(
    collection_name="my-collection",
    query=output["embeddings"][0],
)
```

Please refer to the [Nomic documentation](https://docs.nomic.ai/reference/endpoints/nomic-embed-text) for more details.
