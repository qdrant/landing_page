---
title: txtai
aliases: [ ../integrations/txtai/ ]
---

# txtai

Qdrant might be also used as an embedding backend in [txtai](https://neuml.github.io/txtai/) semantic applications.

txtai simplifies building AI-powered semantic search applications using Transformers. It leverages the neural embeddings and their
properties to encode high-dimensional data in a lower-dimensional space and allows to find similar objects based on their embeddings'
proximity.

Qdrant is not built-in txtai backend and requires installing an additional dependency:

```bash
pip install qdrant-txtai
```

The examples and some more information might be found in [qdrant-txtai repository](https://github.com/qdrant/qdrant-txtai).
