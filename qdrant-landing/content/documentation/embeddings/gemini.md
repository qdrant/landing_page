---
title: Gemini
weight: 1600
---

| Time: 10 min | Level: Beginner | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/gemini-getting-started/gemini-getting-started/gemini-getting-started.ipynb)   |
| --- | ----------- | ----------- |

# Gemini

Qdrant is compatible with Gemini Embedding Model API and its official Python SDK that can be installed as any other package:

Gemini is a new family of Google PaLM models, released in December 2023. The new embedding models succeed the previous Gecko Embedding Model. 

In the latest models, an additional parameter, `task_type`, can be passed to the API call. This parameter serves to designate the intended purpose for the embeddings utilized.

The Embedding Model API supports various task types, outlined as follows:

1. `retrieval_query`: query in a search/retrieval setting
2. `retrieval_document`: document from the corpus being searched
3. `semantic_similarity`: semantic text similarity
4. `classification`: embeddings to be used for text classification
5. `clustering`: the generated embeddings will be used for clustering
6. `task_type_unspecified`: Unset value, which will default to one of the other values.


If you're building a semantic search application, such as RAG, you should use `task_type="retrieval_document"` for the indexed documents and `task_type="retrieval_query"` for the search queries. 

The following example shows how to do this with Qdrant:

## Setup

```bash
pip install google-generativeai
```

Let's see how to use the Embedding Model API to embed a document for retrieval. 

The following example shows how to embed a document with the `models/embedding-001` with the `retrieval_document` task type:

## Embedding a document

```python
import google.generativeai as gemini_client
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

collection_name = "example_collection"

GEMINI_API_KEY = "YOUR GEMINI API KEY"  # add your key here

client = QdrantClient(url="http://localhost:6333")
gemini_client.configure(api_key=GEMINI_API_KEY)
texts = [
    "Qdrant is a vector database that is compatible with Gemini.",
    "Gemini is a new family of Google PaLM models, released in December 2023.",
]

results = [
    gemini_client.embed_content(
        model="models/embedding-001",
        content=sentence,
        task_type="retrieval_document",
        title="Qdrant x Gemini",
    )
    for sentence in texts
]
```

## Creating Qdrant Points and Indexing documents with Qdrant

### Creating Qdrant Points

```python
points = [
    PointStruct(
        id=idx,
        vector=response['embedding'],
        payload={"text": text},
    )
    for idx, (response, text) in enumerate(zip(results, texts))
]
```

### Create Collection

```python
client.create_collection(collection_name, vectors_config=
    VectorParams(
        size=768,
        distance=Distance.COSINE,
    )
)
```

### Add these into the collection

```python
client.upsert(collection_name, points)
```

## Searching for documents with Qdrant

Once the documents are indexed, you can search for the most relevant documents using the same model with the `retrieval_query` task type:

```python
client.search(
    collection_name=collection_name,
    query_vector=gemini_client.embed_content(
        model="models/embedding-001",
        content="Is Qdrant compatible with Gemini?",
        task_type="retrieval_query",
    )["embedding"],
)
```

## Using Gemini Embedding Models with Binary Quantization

You can use Gemini Embedding Models with [Binary Quantization](/articles/binary-quantization/) - a technique that allows you to reduce the size of the embeddings by 32 times without losing the quality of the search results too much. 

In this table, you can see the results of the search with the `models/embedding-001` model with Binary Quantization in comparison with the original model:

At an oversampling of 3 and a limit of 100, we've a 95% recall against the exact nearest neighbors with rescore enabled.

| Oversampling |         | 1        | 1        | 2        | 2        | 3        | 3        |
|--------------|---------|----------|----------|----------|----------|----------|----------|
|              | **Rescore** | False    | True     | False    | True     | False    | True     |
| **Limit**    |         |          |          |          |          |          |          |
| 10           |         | 0.523333 | 0.831111 | 0.523333 | 0.915556 | 0.523333 | 0.950000 |
| 20           |         | 0.510000 | 0.836667 | 0.510000 | 0.912222 | 0.510000 | 0.937778 |
| 50           |         | 0.489111 | 0.841556 | 0.489111 | 0.913333 | 0.488444 | 0.947111 |
| 100          |         | 0.485778 | 0.846556 | 0.485556 | 0.929000 | 0.486000 | **0.956333** |

That's it! You can now use Gemini Embedding Models with Qdrant!
