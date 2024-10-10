---
title: dsRAG
---

# dsRAG

[dsRAG](https://github.com/D-Star-AI/dsRAG) is a retrieval engine for unstructured data. It is especially good at handling challenging queries over dense text, like financial reports, legal documents, and academic papers. dsRAG achieves substantially higher accuracy than vanilla RAG baselines on complex open-book question answering tasks

You can use the Qdrant connector in dsRAG to add and semantically retrieve documents from your collections.

## Usage Example

```python
from dsrag.database.vector import QdrantVectorDB
import numpy as np
from qdrant_clien import models

db = QdrantVectorDB(kb_id=self.kb_id, url="http://localhost:6334", prefer_grpc=True)
vectors = [np.array([1, 0]), np.array([0, 1])]

# You can use any document loaders available with dsRAG
# We'll use literals for demonstration
documents = [
    {
        "doc_id": "1",
        "chunk_index": 0,
        "chunk_header": "Header1",
        "chunk_text": "Text1",
    },
    {
        "doc_id": "2",
        "chunk_index": 1,
        "chunk_header": "Header2",
        "chunk_text": "Text2",
    },
]

db.add_vectors(vectors, documents)

metadata_filter = models.Filter(
    must=[models.FieldCondition(key="doc_id", match=models.MatchValue(value="1"))]
)

db.search(query_vector, top_k=4, metadata_filter=metadata_filter)
```

## Further Reading

- [dsRAG Source](https://github.com/D-Star-AI/dsRAG).
- [dsRAG Examples](https://github.com/D-Star-AI/dsRAG/tree/main/examples)
