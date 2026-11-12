```python
import os
from typing import Any

import requests
from qdrant_client import QdrantClient, models

JINA_URL = "https://api.jina.ai/v1/embeddings"
MODEL = "jina-embeddings-v5-text-small"

def jina_embed(**body: Any) -> list[dict[str, Any]]:
    response = requests.post(
        JINA_URL,
        headers={"Authorization": f"Bearer {os.environ['JINA_API_KEY']}"},
        json=body,
    )
    response.raise_for_status()
    return response.json()["data"]

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
```
