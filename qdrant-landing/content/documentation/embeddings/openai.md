---
title: OpenAI 
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

client = qdrant_client.QdrantClient(":memory:")

texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

The following example shows how to embed a document with the `text-embedding-3-small` model that generates sentence embeddings of size 1536. You can find the list of all supported models [here](https://platform.openai.com/docs/models/embeddings).

### Embedding a document

```python
embedding_model = "text-embedding-3-small"

result = openai_client.embeddings.create(input=texts, model=embedding_model)
```

### Converting the model outputs to Qdrant points

```python
from qdrant_client.models import PointStruct

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
from qdrant_client.models import VectorParams, Distance

collection_name = "example_collection"

client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=1536,
        distance=Distance.COSINE,
    ),
)
client.upsert(collection_name, points)
```

## Searching for documents with Qdrant

Once the documents are indexed, you can search for the most relevant documents using the same model.

```python
client.search(
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


|Method|Dimensionality|Test Dataset|Recall|Oversampling|
|-|-|-|-|-|
|OpenAI text-embedding-3-large|3072|[DBpedia 1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-3072-1M) | 0.9966|3x|
|OpenAI text-embedding-3-small|1536|[DBpedia 100K](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K)| 0.9847|3x|
|OpenAI text-embedding-3-large|1536|[DBpedia 1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-1M)| 0.9826|3x|
|OpenAI text-embedding-ada-002|1536|[DbPedia 1M](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) |0.98|4x|
