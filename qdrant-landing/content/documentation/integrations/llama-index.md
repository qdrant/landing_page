---
title: LlamaIndex
weight: 200
---

# LlamaIndex (GPT Index)

LlamaIndex (formerly GPT Index) acts as an interface between your external data and Large Language Models. So you can bring your 
private data and augment LLMs with it. LlamaIndex simplifies data ingestion and indexing, integrating Qdrant as a vector index.

Installing LlamaIndex is straightforward if we use pip as a package manager. Qdrant is not installed by default, so we need to 
install it separately:

```bash
pip install llama-index qdrant-client
```

LlamaIndex requires providing an instance of `QdrantClient`, so it can interact with Qdrant server.

```python
from llama_index.vector_stores.qdrant import QdrantVectorStore

import qdrant_client

client = qdrant_client.QdrantClient(
    "<qdrant-url>",
    api_key="<qdrant-api-key>", # For Qdrant Cloud, None for local instance
)

index = QdrantVectorStore(client=client, collection_name="documents")
```

The library [comes with a notebook](https://github.com/jerryjliu/llama_index/blob/main/docs/examples/vector_stores/QdrantIndexDemo.ipynb) 
that shows an end-to-end example of how to use Qdrant within LlamaIndex.