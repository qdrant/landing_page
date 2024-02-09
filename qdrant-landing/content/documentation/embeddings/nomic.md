---
title: "Nomic"
weight: 1100
---

# Nomic

The `nomic-embed-text-v1` model is an open source [8192 context length]((https://github.com/nomic-ai/contrastors)) text encoder.
While you can find it on the [Hugging Face Hub](https://huggingface.co/nomic-ai/nomic-embed-text-v1), 
you may have more success through the [Nomic Text Embeddings](https://docs.nomic.ai/reference/endpoints/nomic-embed-text).
Once installed, you can configure it with the official Python client or through direct HTTP requests.

You can use Nomic embeddings directly in Qdrant client calls. There is a difference in the way the embeddings
are obtained for documents and queries. The `task_type` parameter defines the embeddings that you get.
For documents, set the `task_type` to `search_document`:

```python
from qdrant_client import QdrantClient, models
from nomic import embed

output = embed.text(
    texts=["Qdrant is the best vector database!"],
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

To query the collection, set the `task_type` to `search_query`:

```python
output = embed.text(
    texts=["What is the best vector database?"],
    model="nomic-embed-text-v1",
    task_type="search_query",
)

qdrant_client.search(
    collection_name="my-collection",
    query=output["embeddings"][0],
)
```

For more information, see the Nomic documentation on [Text embeddings](https://docs.nomic.ai/reference/endpoints/nomic-embed-text).
