---
title: Dynamiq
---


# Dynamiq

Dynamiq is your all-in-one Gen AI framework, designed to streamline the development of AI-powered applications. Dynamiq specializes in orchestrating retrieval-augmented generation (RAG) and large language model (LLM) agents.

Qdrant is a vector database available in Dynamiq, capable of serving multiple roles. It can be used for writing and retrieving documents, acting as memory for agent interactions, and functioning as a retrieval tool that agents can call when needed.

## Installing

First, ensure you have the `dynamiq` library installed:  

```bash
$ pip install dynamiq
```  

## Retriever node

The QdrantDocumentRetriever node enables efficient retrieval of relevant documents based on vector similarity search.

```python
from dynamiq.nodes.retrievers import QdrantDocumentRetriever
from dynamiq import Workflow

# Define a retriever node to fetch most relevant documents
retriever_node = QdrantDocumentRetriever(
    index_name="default",
    top_k=5,  # Optional: Maximum number of documents to retrieve
    filters={...}  # Optional: Additional filtering conditions
)

# Create a workflow and add the retriever node
wf = Workflow()
wf.flow.add_nodes(retriever_node)

# Execute retrieval
result = wf.run(input_data={
  'embedding': query_embedding  # Provide an embedded query for similarity search
})

```  

## Writer node

The QdrantDocumentWriter node allows storing documents in the Qdrant vector database.

```python
from dynamiq.nodes.writers import QdrantDocumentWriter

# Define a writer node to store documents in Qdrant
writer_node = QdrantDocumentWriter(
    index_name="default",
    create_if_not_exist=True
)

# Create a workflow and add the writer node
wf = Workflow()
wf.flow.add_nodes(writer_node)

# Execute writing
result = wf.run(input_data={
  'documents': embedded_documents  # Provide embedded documents for storage
})
```  

# Additional Tutorials

Discover additional examples and use cases of Qdrant with Dynamiq:  

- [Using Qdrant with Dynamiq – A Hands-on Tutorial](https://colab.research.google.com/drive/1rlZJW4lOM36b7ZxK-dVJv5dE2xrgwxU_?usp=sharing)
- [End-to-End Application with Qdrant and Dynamiq](https://colab.research.google.com/drive/1RaR25BCj_D5wzQ70ejUQyKzdCM6DUXMF?usp=sharing)



## For more details, please refer to:

-  [Dynamiq Documentation](https://docs.getdynamiq.ai/)
-  [Dynamiq GitHub](https://github.com/dynamiq-ai/dynamiq)
