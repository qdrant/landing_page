---
title: OCI (Oracle Cloud Infrastructure)
weight: 2500
---

# Using OCI (Oracle Cloud Infrastructure) with Qdrant 

OCI provides robust cloud-based embeddings for various media types. The Generative AI Embedding Models convert textual input - ranging from phrases and sentences to entire paragraphs - into a structured format known as embeddings. Each piece of text input is transformed into a numerical array consisting of 1024 distinct numbers.

## Installation

You can install the required package using the following pip command:

```bash
pip install oci
```

## Code Example

Below is an example of how to obtain embeddings using OCI (Oracle Cloud Infrastructure)'s API and store them in a Qdrant collection:

```python
import qdrant_client
from qdrant_client.models import Batch
import oci

# Initialize OCI client
config = oci.config.from_file()
ai_client = oci.ai_language.AIServiceLanguageClient(config)

# Generate embeddings using OCI's AI service
text = "OCI provides cloud-based AI services."
response = ai_client.batch_detect_language_entities(text)
embeddings = response.data[0].entities[0].embedding

# Initialize Qdrant client
qdrant_client = qdrant_client.QdrantClient(host="localhost", port=6333)

# Upsert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="CloudAI",
    points=Batch(
        ids=[1],
        vectors=[embeddings],
    )
)

```

