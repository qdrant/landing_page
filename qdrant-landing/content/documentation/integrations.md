---
title: Integrations
weight: 52
---
Qdrant is a vector database performing an approximate nearest neighbours search on neural embeddings. It can work perfectly fine
as a standalone system, yet, in some cases, you may find it easier to implement your semantic search application using some
higher-level libraries. Some of such projects provide ready-to-go integrations and here is a curated list of them.

## DocArray
You can use Qdrant natively in DocArray, where Qdrant serves as a high-performance document store to enable scalable vector search.

DocArray is a library from Jina AI for nested, unstructured data in transit, including text, image, audio, video, 3D mesh, etc.
It allows deep-learning engineers to efficiently process, embed, search, recommend, store, and transfer the data with a Pythonic API.


To install DocArray with Qdrant support, please do

```bash
pip install "docarray[qdrant]"
```

More information can be found in [DocArray's documentations](https://docarray.jina.ai/advanced/document-store/qdrant/).

## txtai
Qdrant might be also used as an embedding backend in [txtai](https://neuml.github.io/txtai/) semantic applications.

txtai simplifies building AI-powered semantic search applications using Transformers. It leverages the neural embeddings and their 
properties to encode high-dimensional data in a lower-dimensional space and allows to find similar objects based on their embeddings' 
proximity.

Qdrant is not built-in txtai backend and requires installing an additional dependency:

```bash
pip install qdrant-txtai
```

The examples and some more information might be found in [qdrant-txtai repository](https://github.com/qdrant/qdrant-txtai).

## Cohere
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
