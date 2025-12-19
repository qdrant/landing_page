---
title: Chonkie
---

# Chonkie

[Chonkie](https://github.com/chonkie-inc/chonkie) is a no-nonsense, ultra-light, and lightning-fast chunking library designed for RAG (Retrieval-Augmented Generation) applications.

Chonkie integrates seamlessly with Qdrant through the **QdrantHandshake** class, allowing you to chunk, embed, and store text data without ever leaving the Chonkie SDK.

## Setup

Install Chonkie with Qdrant support:

```bash
pip install "chonkie[qdrant]"
```

## Basic Usage

The `QdrantHandshake` provides a simple interface for storing and searching chunks:

```python
from chonkie import QdrantHandshake, SemanticChunker

# Initialize handshake with custom embedding model
handshake = QdrantHandshake(
    url="http://localhost:6333",
    collection_name="my_documents",
    embedding_model="sentence-transformers/all-MiniLM-L6-v2"
)

# Create and write chunks
chunker = SemanticChunker()
chunks = chunker.chunk("Your text content here...")
handshake.write(chunks)

# Search using natural language
results = handshake.search(query="your search query", limit=5)
for result in results:
    print(f"{result['score']}: {result['text']}")
```

### Qdrant Cloud

```python
handshake = QdrantHandshake(
    url="https://your-cluster.qdrant.io",
    api_key="your-api-key",
    collection_name="my_collection",
    embedding_model="BAAI/bge-small-en-v1.5"  # Change to your preferred model
)
```

## Complete RAG Pipeline

Build end-to-end RAG pipelines using Chonkie's fluent Pipeline API:

```python
from chonkie import Pipeline

# Process documents and store in Qdrant with custom embedding model
docs = (Pipeline()
    .fetch_from("file", dir="./knowledge_base", ext=[".txt", ".md"])
    .process_with("text")
    .chunk_with("semantic", chunk_size=512)
    .store_in("qdrant",
              collection_name="knowledge",
              url="http://localhost:6333",
              embedding_model="sentence-transformers/all-MiniLM-L6-v2")
    .run())

print(f"Ingested {len(docs)} documents into Qdrant")
```

### Pipeline with Refinements

```python
from chonkie import Pipeline

# Advanced pipeline with overlapping context and custom embeddings
docs = (Pipeline()
    .fetch_from("file", dir="./docs")
    .process_with("text")
    .chunk_with("semantic", threshold=0.8)
    .refine_with("overlap", context_size=100)
    .store_in("qdrant",
              url="https://your-cluster.qdrant.io",
              api_key="your-api-key",
              collection_name="knowledge_base",
              embedding_model="BAAI/bge-small-en-v1.5")
    .run())
```

## Next steps

- Chonkie [GitHub Repository](https://github.com/chonkie-inc/chonkie)
- Chonkie [Documentation](https://chonkie.ai)
- QdrantHandshake [API Reference](https://docs.chonkie.ai/oss/handshakes/qdrant-handshake)
- Chonkie [Chunking Strategies](https://docs.chonkie.ai/oss/chunkers/overview)
- Qdrant Python Client [Documentation](https://python-client.qdrant.tech/)
