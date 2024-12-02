---
title: Mistral 
---

| Time: 10 min | Level: Beginner | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/mistral-getting-started/mistral-embed-getting-started/mistral_qdrant_getting_started.ipynb)   |
| --- | ----------- | ----------- |

# Mistral
Qdrant is compatible with the new released Mistral Embed and its official Python SDK that can be installed as any other package:

## Setup

### Install the client

```bash
pip install mistralai
```

And then we set this up:

```python
from mistralai.client import MistralClient
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

collection_name = "example_collection"

MISTRAL_API_KEY = "your_mistral_api_key"
client = QdrantClient(":memory:")
mistral_client = MistralClient(api_key=MISTRAL_API_KEY)
texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

Let's see how to use the Embedding Model API to embed a document for retrieval. 

The following example shows how to embed a document with the `models/embedding-001` with the `retrieval_document` task type:

## Embedding a document

```python
result = mistral_client.embeddings(
    model="mistral-embed",
    input=texts,
)
```

The returned result has a data field with a key: `embedding`. The value of this key is a list of floats representing the embedding of the document.

### Converting this into Qdrant Points

```python
points = [
    PointStruct(
        id=idx,
        vector=response.embedding,
        payload={"text": text},
    )
    for idx, (response, text) in enumerate(zip(result.data, texts))
]
```

## Create a collection and Insert the documents

```python
client.create_collection(collection_name, vectors_config=VectorParams(
        size=1024,
        distance=Distance.COSINE,
    )
)
client.upsert(collection_name, points)
```

## Searching for documents with Qdrant

Once the documents are indexed, you can search for the most relevant documents using the same model with the `retrieval_query` task type:

```python
client.search(
    collection_name=collection_name,
    query_vector=mistral_client.embeddings(
        model="mistral-embed", input=["What is the best to use for vector search scaling?"]
    ).data[0].embedding,
)
```

## Using Mistral Embedding Models with Binary Quantization

You can use Mistral Embedding Models with [Binary Quantization](/articles/binary-quantization/) - a technique that allows you to reduce the size of the embeddings by 32 times without losing the quality of the search results too much. 

At an oversampling of 3 and a limit of 100, we've a 95% recall against the exact nearest neighbors with rescore enabled.

| Oversampling |         | 1        | 1        | 2        | 2        | 3        | 3            |
|--------------|---------|----------|----------|----------|----------|----------|--------------|
|              | **Rescore** | False    | True     | False    | True     | False    | True         |
| **Limit**    |         |          |          |          |          |          |              |
| 10           |         | 0.53444  | 0.857778 | 0.534444 | 0.918889 | 0.533333 | 0.941111     |
| 20           |         | 0.508333 | 0.837778 | 0.508333 | 0.903889 | 0.508333 | 0.927778     |
| 50           |         | 0.492222 | 0.834444 | 0.492222 | 0.903556 | 0.492889 | 0.940889     |
| 100          |         | 0.499111 | 0.845444 | 0.498556 | 0.918333 | 0.497667 | **0.944556** |

That's it! You can now use Mistral Embedding Models with Qdrant!
