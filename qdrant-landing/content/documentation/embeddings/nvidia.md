---
title: Nvidia
---

# Nvidia

Qdrant supports working with [Nvidia embeddings](https://build.nvidia.com/explore/retrieval).

You can generate an API key to authenticate the requests from the [Nvidia Playground](<https://build.nvidia.com/nvidia/embed-qa-4>).

### Setting up the Qdrant client and Nvidia session

```python
import requests
from qdrant_client import QdrantClient

NVIDIA_BASE_URL = "https://ai.api.nvidia.com/v1/retrieval/nvidia/embeddings"

NVIDIA_API_KEY = "<YOUR_API_KEY>"

nvidia_session = requests.Session()

client = QdrantClient(":memory:")

headers = {
    "Authorization": f"Bearer {NVIDIA_API_KEY}",
    "Accept": "application/json",
}

texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const NVIDIA_BASE_URL = "https://ai.api.nvidia.com/v1/retrieval/nvidia/embeddings"
const NVIDIA_API_KEY = "<YOUR_API_KEY>"

const client = new QdrantClient({ url: 'http://localhost:6333' });

const headers = {
    "Authorization": "Bearer " + NVIDIA_API_KEY,
    "Accept": "application/json",
    "Content-Type": "application/json"
}

const texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

The following example shows how to embed documents with the `embed-qa-4` model that generates sentence embeddings of size 1024.

### Embedding documents

```python
payload = {
    "input": texts,
    "input_type": "passage",
    "model": "NV-Embed-QA",
}

response_body = nvidia_session.post(
    NVIDIA_BASE_URL, headers=headers, json=payload
).json()
```

```typescript
let body = {
    "input": texts,
    "input_type": "passage",
    "model": "NV-Embed-QA"
}

let response = await fetch(NVIDIA_BASE_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers
});

let response_body = await response.json()
```

### Converting the model outputs to Qdrant points

```python
from qdrant_client.models import PointStruct

points = [
    PointStruct(
        id=idx,
        vector=data["embedding"],
        payload={"text": text},
    )
    for idx, (data, text) in enumerate(zip(response_body["data"], texts))
]
```

```typescript
let points = response_body.data.map((data, i) => {
    return {
        id: i,
        vector: data.embedding,
        payload: {
            text: texts[i]
        }
    }
})
```

### Creating a collection to insert the documents

```python
from qdrant_client.models import VectorParams, Distance

collection_name = "example_collection"

client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=1024,
        distance=Distance.COSINE,
    ),
)
client.upsert(collection_name, points)
```

```typescript
const COLLECTION_NAME = "example_collection"

await client.createCollection(COLLECTION_NAME, {
    vectors: {
        size: 1024,
        distance: 'Cosine',
    }
});

await client.upsert(COLLECTION_NAME, {
    wait: true,
    points
})
```

## Searching for documents with Qdrant

Once the documents are added, you can search for the most relevant documents.

```python
payload = {
    "input": "What is the best to use for vector search scaling?",
    "input_type": "query",
    "model": "NV-Embed-QA",
}

response_body = nvidia_session.post(
    NVIDIA_BASE_URL, headers=headers, json=payload
).json()

client.search(
    collection_name=collection_name,
    query_vector=response_body["data"][0]["embedding"],
)
```

```typescript
body = {
    "input": "What is the best to use for vector search scaling?",
    "input_type": "query",
    "model": "NV-Embed-QA",
}

response = await fetch(NVIDIA_BASE_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers
});

response_body = await response.json()

await client.search(COLLECTION_NAME, {
    vector: response_body.data[0].embedding,
});
```
