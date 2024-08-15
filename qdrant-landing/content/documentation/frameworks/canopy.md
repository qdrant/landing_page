---
title: Pinecone Canopy
---

# Pinecone Canopy

[Canopy](https://github.com/pinecone-io/canopy) is an open-source framework and context engine to build chat assistants at scale.

Qdrant is supported as a knowledge base within Canopy for context retrieval and augmented generation.

## Usage

Install the SDK with the Qdrant extra as described in the [Canopy README](https://github.com/pinecone-io/canopy?tab=readme-ov-file#extras).

```bash
pip install canopy-sdk[qdrant]
```

### Creating a knowledge base

```python
from canopy.knowledge_base import QdrantKnowledgeBase

kb = QdrantKnowledgeBase(collection_name="<YOUR_COLLECTION_NAME>")
```

<aside role="status">The constructor accepts additional <a href="https://github.com/qdrant/qdrant-client/blob/eda201a1dbf1bbc67415f8437a5619f6f83e8ac6/qdrant_client/qdrant_client.py#L36-L61">options</a> to customize your connection to Qdrant.</aside>

To create a new Qdrant collection and connect it to the knowledge base, use the `create_canopy_collection` method:

```python
kb.create_canopy_collection()
```

You can always verify the connection to the collection with the `verify_index_connection` method:

```python
kb.verify_index_connection()
```

Learn more about customizing the knowledge base and its inner components [in the Canopy library](https://github.com/pinecone-io/canopy/blob/main/docs/library.md#understanding-knowledgebase-workings).

### Adding data to the knowledge base

To insert data into the knowledge base, you can create a list of documents and use the `upsert` method:

```python
from canopy.models.data_models import Document

documents = [
    Document(
        id="1",
        text="U2 are an Irish rock band from Dublin, formed in 1976.",
        source="https://en.wikipedia.org/wiki/U2",
    ),
    Document(
        id="2",
        text="Arctic Monkeys are an English rock band formed in Sheffield in 2002.",
        source="https://en.wikipedia.org/wiki/Arctic_Monkeys",
        metadata={"my-key": "my-value"},
    ),
]

kb.upsert(documents)
```

### Querying the knowledge base

You can query the knowledge base with the `query` method to find the most similar documents to a given text:

```python
from canopy.models.data_models import Query

kb.query(
    [
        Query(text="Arctic Monkeys music genre"),
        Query(
            text="U2 music genre",
            top_k=10,
            metadata_filter={"key": "my-key", "match": {"value": "my-value"}},
        ),
    ]
)
```

## Further Reading

- [Introduction to Canopy](https://www.pinecone.io/blog/canopy-rag-framework/)
- [Canopy library reference](https://github.com/pinecone-io/canopy/blob/main/docs/library.md)
- [Source Code](https://github.com/pinecone-io/canopy/tree/main/src/canopy/knowledge_base/qdrant)
