---
title: "FastEmbed & Qdrant"
weight: 3
---

# Using FastEmbed with Qdrant for Vector Search

## Install Qdrant Client
```python
pip install qdrant-client
```

## Install FastEmbed
Installing FastEmbed will let you quickly turn data to vectors, so that Qdrant can search over them.
```python
pip install fastembed
```

## Initialize the client
Qdrant Client has a simple in-memory mode that lets you try semantic search locally. 
```python
from qdrant_client import QdrantClient

client = QdrantClient(":memory:")  # Qdrant is running from RAM.
```

## Add data
Now you can add two sample documents, their associated metadata, and a point `id` for each. 

```python
docs = ["Qdrant has a LangChain integration for chatbots.", "Qdrant has a LlamaIndex integration for agents."]
metadata = [
    {"source": "langchain-docs"},
    {"source": "llamaindex-docs"},
]
ids = [42, 2]
```
## Load data to a collection
Create a test collection and upsert your two documents to it. 
```python
client.add(
    collection_name="test_collection",
    documents=docs,
    metadata=metadata,
    ids=ids
)
```
## Run vector search

Here, you will ask a dummy question that will allow you to retrieve a semantically relevant result. 

```python
search_result = client.query(
    collection_name="test_collection",
    query_text="Which integration is best for agents?"
)
print(search_result)
```
The semantic search engine will retrieve the most similar result in order of relevance. In this case, the second statement about LlamaIndex is more relevant.

```bash
[QueryResponse(id=2, embedding=None, sparse_embedding=None, 
metadata={'document': 'Qdrant has a LlamaIndex integration for agents',
'source': 'llamaindex-docs'}, document='Qdrant has a LlamaIndex integration for agents.', 
score=0.8749180370667156), 
QueryResponse(id=42, embedding=None, sparse_embedding=None, 
metadata={'document': 'Qdrant has a LangChain integration for chatbots.', 
'source': 'langchain-docs'}, document='Qdrant has a LangChain integration for chatbots.', 
score=0.8351846822959111)]
```