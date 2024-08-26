
---
title: Watsonx
weight: 3000
aliases:
  - /documentation/examples/watsonx-search/
  - /documentation/tutorials/watsonx-search/
  - /documentation/integrations/watsonx/ 
---

# Using Watsonx with Qdrant 

Watsonx is IBM's platform for AI embeddings, focusing on enterprise-level text and data analytics. These embeddings are suitable for high-precision vector searches in Qdrant.

## Installation

You can install the required package using the following pip command:

```bash
pip install watsonx
```

## Code Example


```python
import qdrant_client
from qdrant_client.models import Batch
from watsonx import Watsonx

# Initialize Watsonx AI model
model = Watsonx("watsonx-model")

# Generate embeddings for enterprise data
text = "Watsonx provides enterprise-level NLP solutions."
embeddings = model.embed(text)

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="EnterpriseData",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)

```
