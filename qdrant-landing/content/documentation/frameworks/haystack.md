---
title: Haystack
aliases:
  - ../integrations/haystack/
  - /documentation/overview/integrations/haystack/
---

# Haystack

[Haystack](https://haystack.deepset.ai/) serves as a comprehensive NLP framework, offering a modular methodology for constructing
cutting-edge generative AI, QA, and semantic knowledge base search systems. A critical element in contemporary NLP systems is an
efficient database for storing and retrieving extensive text data. Vector databases excel in this role, as they house vector
representations of text and implement effective methods for swift retrieval. Thus, we are happy to announce the integration
with Haystack - `QdrantDocumentStore`. This document store is unique, as it is maintained externally by the Qdrant team.

The new document store comes as a separate package and can be updated independently of Haystack:

```bash
pip install qdrant-haystack
```

`QdrantDocumentStore` supports [all the configuration properties](/documentation/collections/#create-collection) available in
the Qdrant Python client. If you want to customize the default configuration of the collection used under the hood, you can
provide that settings when you create an instance of the `QdrantDocumentStore`. For example, if you'd like to enable the
Scalar Quantization, you'd make that in the following way:

```python
from qdrant_haystack.document_stores import QdrantDocumentStore
from qdrant_client import models

document_store = QdrantDocumentStore(
    ":memory:",
    index="Document",
    embedding_dim=512,
    recreate_index=True,
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            quantile=0.99,
            always_ram=True,
        ),
    ),
)
```

## Further Reading

- [Haystack Documentation](https://haystack.deepset.ai/integrations/qdrant-document-store)
- [Source Code](https://github.com/deepset-ai/haystack-core-integrations/tree/main/integrations/qdrant)
