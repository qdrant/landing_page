---
title: Aleph Alpha
weight: 900
aliases:
  - /documentation/examples/aleph-alpha-search/
  - /documentation/tutorials/aleph-alpha-search/
  - /documentation/integrations/aleph-alpha/ 
---

# Using Aleph Alpha Embeddings with Qdrant 

Aleph Alpha is a multimodal and multilingual embeddings' provider. Their API allows creating the embeddings for text and images, both 
in the same latent space. They maintain an [official Python client](https://github.com/Aleph-Alpha/aleph-alpha-client) that might be 
installed with pip:

```bash
pip install aleph-alpha-client
```

There is both synchronous and asynchronous client available. Obtaining the embeddings for an image and storing it into Qdrant might 
be done in the following way:

```python
import qdrant_client
from qdrant_client.models import Batch

from aleph_alpha_client import (
    Prompt,
    AsyncClient,
    SemanticEmbeddingRequest,
    SemanticRepresentation,
    ImagePrompt
)

aa_token = "<< your_token >>"
model = "luminous-base"

qdrant_client = qdrant_client.QdrantClient()
async with AsyncClient(token=aa_token) as client:
    prompt = ImagePrompt.from_file("./path/to/the/image.jpg")
    prompt = Prompt.from_image(prompt)

    query_params = {
        "prompt": prompt,
        "representation": SemanticRepresentation.Symmetric,
        "compress_to_size": 128,
    }
    query_request = SemanticEmbeddingRequest(**query_params)
    query_response = await client.semantic_embed(
        request=query_request, model=model
    )
    
    qdrant_client.upsert(
        collection_name="MyCollection",
        points=Batch(
            ids=[1],
            vectors=[query_response.embedding],
        )
    )
```

If we wanted to create text embeddings with the same model, we wouldn't use `ImagePrompt.from_file`, but simply provide the input 
text into the `Prompt.from_text` method.
