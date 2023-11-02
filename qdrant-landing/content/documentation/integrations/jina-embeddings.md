---
title: Jina Embeddings
weight: 800
---

# Jina Embeddings

Qdrant can also easily work with [Jina embeddings](https://jina.ai/embeddings/) which allow for model input lengths of up to 8192 tokens.

To call their endpoint, all you need is an API key obtainable [here](https://jina.ai/embeddings/).

```python
import qdrant_client
import requests

from qdrant_client.http.models import Distance, VectorParams
from qdrant_client.http.models import Batch

# Provide Jina API key and choose one of the available models.
# You can get a free trial key here: https://jina.ai/embeddings/
JINA_API_KEY = "jina_xxxxxxxxxxx"
MODEL = "jina-embeddings-v2-base-en"  # or "jina-embeddings-v2-base-en"
EMBEDDING_SIZE = 768  # 512 for small variant

# Get embeddings from the API
url = "https://api.jina.ai/v1/embeddings"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JINA_API_KEY}",
}

data = {
    "input": ["Your text string goes here", "You can send multiple texts"],
    "model": MODEL,
}

response = requests.post(url, headers=headers, json=data)
embeddings = [d["embedding"] for d in response.json()["data"]]


# Index the embeddings into Qdrant
qdrant_client = qdrant_client.QdrantClient(":memory:")
qdrant_client.create_collection(
    collection_name="MyCollection",
    vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.DOT),
)


qdrant_client.upsert(
    collection_name="MyCollection",
    points=Batch(
        ids=list(range(len(embeddings))),
        vectors=embeddings,
    ),
)

```

