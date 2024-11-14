---
title: Ragbits
---

# Ragbits

[Ragbit](https://ragbits.deepsense.ai) is a Python package that offers essential "bits" for building powerful Retrieval-Augmented Generation (RAG) applications. It prioritizes developer experience by providing a simple and intuitive API. It also includes a comprehensive set of tools for seamlessly building, testing, and deploying your RAG applications efficiently.

Qdrant is available as a vectorstore in Ragbits to ingest and search search documents from a collection.

## Installation

Install the Python package that comes bundled with the Qdrant integration.

```bash
pip install ragbits
```

## Usage

An example usage of Ragbits and Qdrant would look something like this:

The following example uses [OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings) via [LiteLLM](https://www.litellm.ai).

```python
import asyncio

from qdrant_client import AsyncQdrantClient

from ragbits.core.embeddings.litellm import LiteLLMEmbeddings
from ragbits.core.vector_stores.qdrant import QdrantVectorStore
from ragbits.document_search import DocumentSearch, SearchConfig
from ragbits.document_search.documents.document import DocumentMeta

documents = [
    DocumentMeta.create_text_document_from_literal(
        "RIP boiled water. You will be mist."
    ),
    DocumentMeta.create_text_document_from_literal(
        "Why programmers don't like to swim? Because they're scared of the floating points."
    ),
    DocumentMeta.create_text_document_from_literal("This one is completely unrelated."),
]


async def main() -> None:
    embedder = LiteLLMEmbeddings(
        model="text-embedding-3-small",
    )
    vector_store = QdrantVectorStore(
        client=AsyncQdrantClient(url="http://localhost:6333"),
        collection_name="{collection_name}",
    )
    document_search = DocumentSearch(
        embedder=embedder,
        vector_store=vector_store,
    )

    await document_search.ingest(documents)

    all_documents = await vector_store.list()
    print([doc.metadata["content"] for doc in all_documents])

    query = "I write computer software. Tell me something."
    vector_store_kwargs = {
        "k": 1,
        "max_distance": None,
    }
    results = await document_search.search(
        query,
        config=SearchConfig(vector_store_kwargs=vector_store_kwargs),
    )

    print(f"Documents similar to: {query}")
    print([element.get_key() for element in results])
```

</details>

## 📚 Further Reading

- Ragbits [Documentation](http://ragbits.deepsense.ai)
- [Source Code](https://github.com/deepsense-ai/ragbits)
