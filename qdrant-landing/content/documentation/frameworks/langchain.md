---
title: Langchain
aliases:
  - ../integrations/langchain/
  - /documentation/overview/integrations/langchain/
---

# Langchain

Langchain is a library that makes developing Large Language Model-based applications much easier. It unifies the interfaces
to different libraries, including major embedding providers and Qdrant. Using Langchain, you can focus on the business value instead of writing the boilerplate.

Langchain distributes the Qdrant integration as a partner package.

It might be installed with pip:

```bash
pip install langchain-qdrant
```

The integration supports searching for relevant documents usin dense/sparse and hybrid retrieval.

Qdrant acts as a vector index that may store the embeddings with the documents used to generate them. There are various ways to use it, but calling `QdrantVectorStore.from_texts` or `QdrantVectorStore.from_documents` is probably the most straightforward way to get started:

```python
from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

doc_store = QdrantVectorStore.from_texts(
    texts, embeddings, url="<qdrant-url>", api_key="<qdrant-api-key>", collection_name="texts"
)
```

## Using an existing collection

To get an instance of `langchain_qdrant.QdrantVectorStore` without loading any new documents or texts, you can use the `QdrantVectorStore.from_existing_collection()` method.

```python
doc_store = QdrantVectorStore.from_existing_collection(
    embeddings=embeddings,
    collection_name="my_documents",
    url="<qdrant-url>",
    api_key="<qdrant-api-key>",
)
```

## Local mode

Python client allows you to run the same code in local mode without running the Qdrant server. That's great for testing things
out and debugging or if you plan to store just a small amount of vectors. The embeddings might be fully kept in memory or
persisted on disk.

### In-memory

For some testing scenarios and quick experiments, you may prefer to keep all the data in memory only, so it gets lost when the
client is destroyed - usually at the end of your script/notebook.

```python
qdrant = QdrantVectorStore.from_documents(
    docs,
    embeddings,
    location=":memory:",  # Local mode with in-memory storage only
    collection_name="my_documents",
)
```

### On-disk storage

Local mode, without using the Qdrant server, may also store your vectors on disk so they’re persisted between runs.

```python
qdrant = Qdrant.from_documents(
    docs,
    embeddings,
    path="/tmp/local_qdrant",
    collection_name="my_documents",
)
```

### On-premise server deployment

No matter if you choose to launch QdrantVectorStore locally with [a Docker container](/documentation/guides/installation/), or
select a Kubernetes deployment with [the official Helm chart](https://github.com/qdrant/qdrant-helm), the way you're
going to connect to such an instance will be identical. You'll need to provide a URL pointing to the service.

```python
url = "<---qdrant url here --->"
qdrant = QdrantVectorStore.from_documents(
    docs,
    embeddings,
    url,
    prefer_grpc=True,
    collection_name="my_documents",
)
```

## Similarity search

`QdrantVectorStore` supports 3 modes for similarity searches. They can be configured using the `retrieval_mode` parameter when setting up the class.

- Dense Vector Search(Default)
- Sparse Vector Search
- Hybrid Search

### Dense Vector Search

To search with only dense vectors,

- The `retrieval_mode` parameter should be set to `RetrievalMode.DENSE`(default).
- A [dense embeddings](https://python.langchain.com/v0.2/docs/integrations/text_embedding/) value should be provided for the `embedding` parameter.

```py
from langchain_qdrant import RetrievalMode

qdrant = QdrantVectorStore.from_documents(
    docs,
    embedding=embeddings,
    location=":memory:",
    collection_name="my_documents",
    retrieval_mode=RetrievalMode.DENSE,
)

query = "What did the president say about Ketanji Brown Jackson"
found_docs = qdrant.similarity_search(query)
```

### Sparse Vector Search

To search with only sparse vectors,

- The `retrieval_mode` parameter should be set to `RetrievalMode.SPARSE`.
- An implementation of the [SparseEmbeddings interface](https://github.com/langchain-ai/langchain/blob/master/libs/partners/qdrant/langchain_qdrant/sparse_embeddings.py) using any sparse embeddings provider has to be provided as value to the `sparse_embedding` parameter.

The `langchain-qdrant` package provides a [FastEmbed](https://github.com/qdrant/fastembed) based implementation out of the box.

To use it, install the FastEmbed package.

```sh
pip install fastembed
```

```python
from langchain_qdrant import FastEmbedSparse, RetrievalMode

sparse_embeddings = FastEmbedSparse(model_name="Qdrant/BM25")

qdrant = QdrantVectorStore.from_documents(
    docs,
    sparse_embedding=sparse_embeddings,
    location=":memory:",
    collection_name="my_documents",
    retrieval_mode=RetrievalMode.SPARSE,
)

query = "What did the president say about Ketanji Brown Jackson"
found_docs = qdrant.similarity_search(query)
```

### Hybrid Vector Search

To perform a hybrid search using dense and sparse vectors with score fusion,

- The `retrieval_mode` parameter should be set to `RetrievalMode.HYBRID`.
- A [dense embeddings](https://python.langchain.com/v0.2/docs/integrations/text_embedding/) value should be provided for the `embedding` parameter.
- An implementation of the [SparseEmbeddings interface](https://github.com/langchain-ai/langchain/blob/master/libs/partners/qdrant/langchain_qdrant/sparse_embeddings.py) using any sparse embeddings provider has to be provided as value to the `sparse_embedding` parameter.

Note that if you've added documents with the HYBRID mode, you can switch to any retrieval mode when searching. Since both the dense and sparse vectors are available in the collection.

## Next steps

If you'd like to know more about running Qdrant in a Langchain-based application, please read our article
[Question Answering with Langchain and Qdrant without boilerplate](/articles/langchain-integration/). Some more information
might also be found in the [Langchain documentation](https://python.langchain.com/docs/integrations/vectorstores/qdrant).

- [Source Code](https://github.com/langchain-ai/langchain/tree/master/libs%2Fpartners%2Fqdrant)
