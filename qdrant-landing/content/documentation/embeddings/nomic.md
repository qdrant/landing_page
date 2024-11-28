---
title: "Nomic"
---

# Nomic

The `nomic-embed-text-v1` model is an open source [8192 context length](https://github.com/nomic-ai/contrastors) text encoder.
While you can find it on the [Hugging Face Hub](https://huggingface.co/nomic-ai/nomic-embed-text-v1), 
you may find it easier to obtain them through the [Nomic Text Embeddings](https://docs.nomic.ai/reference/endpoints/nomic-embed-text).
Once installed, you can configure it with the official Python client, FastEmbed or through direct HTTP requests.

<aside role="status">Using Nomic Embeddings via the Nomic API/SDK requires configuring the <a href="https://atlas.nomic.ai/cli-login">Nomic API token</a>.</aside>

You can use Nomic embeddings directly in Qdrant client calls. There is a difference in the way the embeddings
are obtained for documents and queries.

#### Upsert using [Nomic SDK](https://github.com/nomic-ai/nomic)

The `task_type` parameter defines the embeddings that you get.
For documents, set the `task_type` to `search_document`:

```python
from qdrant_client import QdrantClient, models
from nomic import embed

output = embed.text(
    texts=["Qdrant is the best vector database!"],
    model="nomic-embed-text-v1",
    task_type="search_document",
)

client = QdrantClient()
client.upsert(
    collection_name="my-collection",
    points=models.Batch(
        ids=[1],
        vectors=output["embeddings"],
    ),
)
```

#### Upsert using [FastEmbed](https://github.com/qdrant/fastembed)

```python
from fastembed import TextEmbedding
from client import QdrantClient, models

model = TextEmbedding("nomic-ai/nomic-embed-text-v1")

output = model.embed(["Qdrant is the best vector database!"])

client = QdrantClient()
client.upsert(
    collection_name="my-collection",
    points=models.Batch(
        ids=[1],
        vectors=[embeddings.tolist() for embeddings in output],
    ),
)
```

#### Search using [Nomic SDK](https://github.com/nomic-ai/nomic)

To query the collection, set the `task_type` to `search_query`:

```python
output = embed.text(
    texts=["What is the best vector database?"],
    model="nomic-embed-text-v1",
    task_type="search_query",
)

client.search(
    collection_name="my-collection",
    query_vector=output["embeddings"][0],
)
```

#### Search using [FastEmbed](https://github.com/qdrant/fastembed)

```python
output = next(model.embed("What is the best vector database?"))

client.search(
    collection_name="my-collection",
    query_vector=output.tolist(),
)
```

For more information, see the Nomic documentation on [Text embeddings](https://docs.nomic.ai/reference/endpoints/nomic-embed-text).
