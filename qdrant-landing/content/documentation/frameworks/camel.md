---
title: CamelAI
---

# Camel

[Camel](https://www.camel-ai.org) is a Python framework to build and use LLM-based agents for real-world task solving.

Qdrant is available as a storage mechanism in Camel for ingesting and retrieving semantically similar data.

## Usage With Qdrant

- Install Camel with the `vector-databases` extra.

```bash
pip install "camel[vector-databases]"
```

- Configure the `QdrantStorage` class.

```python
from camel.storages import QdrantStorage, VectorDBQuery, VectorRecord
from camel.types import VectorDistance

qdrant_storage = QdrantStorage(
    url_and_api_key=(
        "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
        "<provide-your-own-key>",
    ),
    collection_name="{collection_name}",
    distance=VectorDistance.COSINE,
    vector_dim=384,
)
```

The `QdrantStorage` class implements methods to read and write to a Qdrant instance. An instance of this class can now be passed to retrievers for interfacing with your Qdrant collections.

```python
qdrant_storage.add([VectorRecord(
            vector=[-0.1, 0.1, ...],
            payload={'key1': 'value1'},
        ),
        VectorRecord(
            vector=[-0.1, 0.1, ...],
            payload={'key2': 'value2'},
        ),])

query_results = qdrant_storage.query(VectorDBQuery(query_vector=[0.1, 0.2, ...], top_k=10))
for result in query_results:
    print(result.record.payload, result.similarity)

qdrant_storage.clear()
```

- Use the `QdrantStorage` in Camel's Vector Retriever.

```python
from camel.embeddings import OpenAIEmbedding
from camel.retrievers import VectorRetriever

# Initialize the VectorRetriever with an embedding model
vr = VectorRetriever(embedding_model=OpenAIEmbedding())

content_input_path = "<URL-TO-SOME-RESOURCE>"

vr.process(content_input_path, qdrant_storage)

# Execute the query and retrieve results
results = vr.query("<SOME_USER_QUERY>", vector_storage)
```

- Camel also provides an Auto Retriever implementation that handles both embedding and storing data and executing queries.

```python
from camel.retrievers import AutoRetriever
from camel.types import StorageType

ar = AutoRetriever(
    url_and_api_key=(
        "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
        "<provide-your-own-key>",
    ),
    storage_type=StorageType.QDRANT,
)

retrieved_info = ar.run_vector_retriever(
    contents=["<URL-TO-SOME-RESOURCE>"],
    query=""<SOME_USER_QUERY>"",
    return_detailed_info=True, 
)

print(retrieved_info)
```

You can refer to the Camel [documentation](https://docs.camel-ai.org/index.html) for more information about the retrieval mechansims.

## End-To-End Examples

- [Camel RAG Cookbook](https://docs.camel-ai.org/cookbooks/agents_with_rag.html)
- [Customer Service Discord Bot with Agentic RAG](https://docs.camel-ai.org/cookbooks/customer_service_Discord_bot_with_agentic_RAG.html)
