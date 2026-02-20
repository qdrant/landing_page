---
title: Microsoft GraphRAG
---

# Microsoft GraphRAG

[Microsoft GraphRAG](https://github.com/microsoft/graphrag) is a Python library for building knowledge graphs from unstructured text and using them for retrieval-augmented generation. It combines graph-based indexing with vector search to improve the quality and relevance of LLM responses.

Qdrant can be used as a custom vector store backend for GraphRAG, enabling you to leverage Qdrant's performance and scalability for storing and searching document embeddings.

## Installation

Install the required packages:

```bash
pip install graphrag qdrant-client
```

## Custom Vector Store Implementation

GraphRAG allows you to register custom vector stores by extending the `VectorStore` base class:

```python
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from graphrag_vectors import VectorStore, VectorStoreDocument


class QdrantVectorStore(VectorStore):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.client = QdrantClient(
            url="https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
            api_key="<your-api-key>",
        )
        self.collection_name = self.index_name
        self.vector_size = kwargs.get("vector_size", 384)

    def create_index(self, **kwargs):
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=self.vector_size, distance=Distance.COSINE
            ),
        )

    def load_documents(
        self, documents: list[VectorStoreDocument], overwrite: bool = False
    ):
        points = [
            PointStruct(id=str(uuid.uuid4()), vector=doc.vector, payload={"_original_id": doc.id})
            for doc in documents
            if doc.vector
        ]
        self.client.upsert(collection_name=self.collection_name, points=points)

    def similarity_search_by_vector(
        self, query_embedding: list[float], k: int = 10, **kwargs
    ):
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=k,
        ).points

        return [
            VectorStoreSearchResult(
                document=VectorStoreDocument(
                    id=hit.payload["_original_id"], vector=hit.vector
                ),
                score=hit.score,
            )
            for hit in results
        ]

     # ...other graphrag_vectors.VectorStore methods
```

## Usage

Register and use the custom Qdrant vector store:

```python
from graphrag_vectors import (
    register_vector_store,
    create_vector_store,
    VectorStoreConfig,
    IndexSchema,
)

# Register the custom vector store
register_vector_store("qdrant", QdrantVectorStore)

# Create and initialize
schema = IndexSchema(index_name="my_collection")
vector_store = create_vector_store(
    VectorStoreConfig(type="qdrant", vector_size=1536),
    schema,
)

vector_store.connect()
vector_store.create_index()

# Load documents
documents = [
    VectorStoreDocument(id="doc_1", vector=[0.1, 0.2, ...]),
    VectorStoreDocument(id="doc_2", vector=[0.3, 0.4, ...]),
]
vector_store.load_documents(documents)

results = vector_store.similarity_search_by_vector([0.5, 0.6, ...], k=5)
```

## Further Reading

- [Microsoft GraphRAG Documentation](https://microsoft.github.io/graphrag/)
- [GraphRAG GitHub Repository](https://github.com/microsoft/graphrag)
