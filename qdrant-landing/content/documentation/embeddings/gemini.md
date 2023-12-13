---
title: Gemini
weight: 700
---

# Gemini

Qdrant is compatible with Gemini Embedding Model API and its official Python SDK that can be installed as any other package:

Gemini is a new family of Google PaLM models, released in December 2023. The new embedding models succeed the previous Gecko Embedding Model. 

In the latest models, an additional parameter, `task_type`, can be passed to the API call. This parameter serves to designate the intended purpose for the embeddings utilized.

The Embedding Model API supports various task types, outlined as follows:

1. `retrieval_query`: Specifies the given text is a query in a search/retrieval setting.
2. `retrieval_document`: Specifies the given text is a document from the corpus being searched.
3. `semantic_similarity`: Specifies the given text will be used for Semantic Text Similarity.
4. `classification`: Specifies that the given text will be classified.
5. `clustering`: Specifies that the embeddings will be used for clustering.
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
import pathlib
import google.generativeai as genai
import qdrant_client

GEMINI_API_KEY = "YOUR GEMINI API KEY"  # add your key here

genai.configure(api_key=GEMINI_API_KEY)

result = genai.embed_content(
    model="models/embedding-001",
    content="Qdrant is the best vector search engine to use with Gemini",
    task_type="retrieval_document",
    title="Qdrant x Gemini",
)
```

The returned result is a dictionary with a key: `embedding`. The value of this key is a list of floats representing the embedding of the document.

## Indexing documents with Qdrant

```python
from qdrant_client.http.models import Batch

qdrant_client = qdrant_client.QdrantClient()
qdrant_client.upsert(
    collection_name="GeminiCollection",
    points=Batch(
        ids=[1],
        vectors=genai.embed_content(
            model="models/embedding-001",
            content="Qdrant is the best vector search engine to use with Gemini",
            task_type="retrieval_document",
            title="Qdrant x Gemini",
        )["embedding"],
    ),
)
```

## Searching for documents with Qdrant

Once the documents are indexed, you can search for the most relevant documents using the same model with the `retrieval_query` task type:

```python
qdrant_client.search(
    collection_name="GeminiCollection",
    query=genai.embed_content(
        model="models/embedding-001",
        content="What is the best vector database to use with Gemini?",
        task_type="retrieval_query",
    )["embedding"],
)
```

## Using Gemini Embedding Models with Binary Quantization

You can use Gemini Embedding Models with [Binary Quantization](../../articles/binary-quantization.md)

| oversampling | rescore | False    | True     | False    | True     | False    | True     |
|--------------|---------|----------|----------|----------|----------|----------|----------|
| limit        |         |          |          |          |          |          |          |
| 10           |         | 0.523333 | 0.831111 | 0.523333 | 0.915556 | 0.523333 | 0.950000 |
| 20           |         | 0.510000 | 0.836667 | 0.510000 | 0.912222 | 0.510000 | 0.937778 |
| 50           |         | 0.489111 | 0.841556 | 0.489111 | 0.913333 | 0.488444 | 0.947111 |
| 100          |         | 0.485778 | 0.846556 | 0.485556 | 0.929000 | 0.486000 | 0.956333 |

That's it! You can now use Gemini Embedding Models with Qdrant!