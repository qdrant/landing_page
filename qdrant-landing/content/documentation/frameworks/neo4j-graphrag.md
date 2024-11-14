---
title: Neo4j GraphRAG
---

# Neo4j GraphRAG

[Neo4j GraphRAG](https://neo4j.com/docs/neo4j-graphrag-python/current/) is a Python package to build graph retrieval augmented generation (GraphRAG) applications using Neo4j and Python. As a first-party library, it offers a robust, feature-rich, and high-performance solution, with the added assurance of long-term support and maintenance directly from Neo4j. It offers a Qdrant retriever natively to search for vectors stored in a Qdrant collection.

## Installation

```bash
pip install neo4j-graphrag[qdrant]
```

## Usage

A vector query with Neo4j and Qdrant could look like:

```python
from neo4j import GraphDatabase
from neo4j_graphrag.retrievers import QdrantNeo4jRetriever
from qdrant_client import QdrantClient
from examples.embedding_biology import EMBEDDING_BIOLOGY

NEO4J_URL = "neo4j://localhost:7687"
NEO4J_AUTH = ("neo4j", "password")

with GraphDatabase.driver(NEO4J_URL, auth=NEO4J_AUTH) as neo4j_driver:
    retriever = QdrantNeo4jRetriever(
        driver=neo4j_driver,
        client=QdrantClient(url="http://localhost:6333"),
        collection_name="{collection_name}",
        id_property_external="neo4j_id",
        id_property_neo4j="id",
    )

retriever.search(query_vector=[0.5523, 0.523, 0.132, 0.523, ...], top_k=5)
```

Alternatively, you can use any [Langchain embeddings providers](https://python.langchain.com/docs/integrations/text_embedding/), to vectorize text queries automatically.

```python
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from neo4j import GraphDatabase
from neo4j_graphrag.retrievers import QdrantNeo4jRetriever
from qdrant_client import QdrantClient

NEO4J_URL = "neo4j://localhost:7687"
NEO4J_AUTH = ("neo4j", "password")

with GraphDatabase.driver(NEO4J_URL, auth=NEO4J_AUTH) as neo4j_driver:
    embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    retriever = QdrantNeo4jRetriever(
        driver=neo4j_driver,
        client=QdrantClient(url="http://localhost:6333"),
        collection_name="{collection_name}",
        id_property_external="neo4j_id",
        id_property_neo4j="id",
        embedder=embedder,
    )

retriever.search(query_text="my user query", top_k=10)
```

## Further Reading

- [Neo4j GraphRAG Reference](https://neo4j.com/docs/neo4j-graphrag-python/current/index.html)
- [Qdrant Retriever Reference](https://neo4j.com/docs/neo4j-graphrag-python/current/user_guide_rag.html#qdrant-neo4j-retriever-user-guide)
- [Source](https://github.com/neo4j/neo4j-graphrag-python/tree/main/src/neo4j_graphrag/retrievers/external/qdrant)
