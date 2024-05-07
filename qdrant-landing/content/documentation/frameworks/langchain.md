---
title: LangChain
weight: 100
aliases:
  - ../integrations/langchain/
  - /documentation/overview/integrations/langchain/
---

# LangChain

LangChain is a library that makes developing Large Language Models based applications much easier. It unifies the interfaces 
to different libraries, including major embedding providers and Qdrant. Using LangChain, you can focus on the business value 
instead of writing the boilerplate.

Langchain comes with the Qdrant integration by default. It might be installed with pip:

```bash
pip install langchain
```

Qdrant acts as a vector index that may store the embeddings with the documents used to generate them. There are various ways 
how to use it, but calling `Qdrant.from_texts` is probably the most straightforward way how to get started:

```python
from langchain.vectorstores import Qdrant
from langchain.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)
doc_store = Qdrant.from_texts(
    texts, embeddings, url="<qdrant-url>", api_key="<qdrant-api-key>", collection_name="texts"
)
```

Calling `Qdrant.from_documents` or `Qdrant.from_texts` will always recreate the collection and remove all the existing points. 
That's fine for some experiments, but you'll prefer not to start from scratch every single time in a real-world scenario. 
If you prefer reusing an existing collection, you can create an instance of Qdrant on your own:

```python
import qdrant_client

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)

client = qdrant_client.QdrantClient(
    "<qdrant-url>",
    api_key="<qdrant-api-key>", # For Qdrant Cloud, None for local instance
)

doc_store = Qdrant(
    client=client, collection_name="texts", 
    embeddings=embeddings,
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
qdrant = Qdrant.from_documents(
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

No matter if you choose to launch Qdrant locally with [a Docker container](/documentation/guides/installation/), or 
select a Kubernetes deployment with [the official Helm chart](https://github.com/qdrant/qdrant-helm), the way you're 
going to connect to such an instance will be identical. You'll need to provide a URL pointing to the service.

```python
url = "<---qdrant url here --->"
qdrant = Qdrant.from_documents(
    docs, 
    embeddings, 
    url, 
    prefer_grpc=True, 
    collection_name="my_documents",
)
```

## Next steps

If you'd like to know more about running Qdrant in a LangChain-based application, please read our article 
[Question Answering with LangChain and Qdrant without boilerplate](/articles/langchain-integration/). Some more information
might also be found in the [LangChain documentation](https://python.langchain.com/docs/integrations/vectorstores/qdrant).

- [Source Code](https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain/vectorstores/qdrant.py)
