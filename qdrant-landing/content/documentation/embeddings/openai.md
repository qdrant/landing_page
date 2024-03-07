---
title: OpenAI 
weight: 800
aliases: [ ../integrations/openai/ ]
---

# OpenAI

Qdrant supports working with [OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings/embeddings).

There is an official OpenAI Python package that simplifies obtaining them, and it can be installed with pip:

```bash
pip install openai
```

### Setting up the OpenAI and Qdrant clients

```python
import openai
import qdrant_client

openai_client = openai.Client(
    api_key="<YOUR_API_KEY>"
)

qdrant_client = qdrant_client.QdrantClient(":memory:")

texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

The following example shows how to embed a document with the `text-embedding-3-small` model that generates sentence embeddings of size 1536. You can find the list of all supported models [here](https://platform.openai.com/docs/models/embeddings).

### Embedding a document

```python
embedding_model = "text-embedding-3-small"

result = openai_client.embeddings.create(input= texts, model=embedding_model)
```

### Converting the model outputs to Qdrant points

```python
from qdrant_client.http.models import PointStruct

points = [
    PointStruct(
        id=idx,
        vector=data.embedding,
        payload={"text": text},
    )
    for idx, (data, text) in enumerate(zip(result.data, texts))
]
```

### Creating a collection to insert the documents

```python
from qdrant_client.http.models import VectorParams, Distance

collection_name = "example_collection"

qdrant_client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=1536,
        distance=Distance.COSINE,
    ),
)
qdrant_client.upsert(collection_name, points)
```

## Searching for documents with Qdrant

Once the documents are indexed, you can search for the most relevant documents using the same model.

```python
qdrant_client.search(
    collection_name=collection_name,
    query_vector=openai_client.embeddings.create(
        input=["What is the best to use for vector search scaling?"],
        model=embedding_model,
    )
    .data[0]
    .embedding,
)
```

## Using OpenAI Embedding Models with Qdrant's Binary Quantization

You can use OpenAI embedding Models with [Binary Quantization](/articles/binary-quantization/) - a technique that allows you to reduce the size of the embeddings by 32 times without losing the quality of the search results too much.

<!-- 
ADD BQ RESULTS
-->
