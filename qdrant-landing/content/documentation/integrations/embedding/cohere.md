---
title: Cohere
weight: 700
---

# Cohere

Qdrant is compatible with Cohere [co.embed API](https://docs.cohere.ai/reference/embed) and its official Python SDK that
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
    ),
)
```

If you are interested in seeing an end-to-end project created with co.embed API and Qdrant, please check out the
"[Question Answering as a Service with Cohere and Qdrant](https://qdrant.tech/articles/qa-with-cohere-and-qdrant/)" article.

## Embed v3

Embed v3 is a new family of Cohere models, released in November 2023. The new models require passing an additional 
parameter to the API call: `input_type`. It determines the type of task you want to use the embeddings for.

- `input_type="search_document"` - for documents to store in Qdrant
- `input_type="search_query"` - for search queries to find the most relevant documents
- `input_type="classification"` - for classification tasks
- `input_type="clustering"` - for text clustering

While implementing semantic search applications, such as RAG, you should use `input_type="search_document"` for the
indexed documents and `input_type="search_query"` for the search queries. The following example shows how to index
documents with the Embed v3 model:

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
            model="embed-english-v3.0",  # New Embed v3 model
            input_type="search_document",  # Input type for documents
            texts=["Qdrant is the a vector database written in Rust"],
        ).embeddings,
    ),
)
```

Once the documents are indexed, you can search for the most relevant documents using the Embed v3 model:

```python
qdrant_client.search(
    collection_name="MyCollection",
    query=cohere_client.embed(
        model="embed-english-v3.0",  # New Embed v3 model
        input_type="search_query",  # Input type for search queries
        texts=["The best vector database"],
    ).embeddings[0],
)
```

<aside role="status">
According to Cohere's documentation, all v3 models can use dot product, cosine similarity, 
and Euclidean distance as the similarity metric, as all metrics return identical rankings.
</aside>
