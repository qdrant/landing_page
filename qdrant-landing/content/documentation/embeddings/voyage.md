---
title: Voyage AI
weight: 3200
---

# Voyage AI

Qdrant supports working with [Voyage AI](https://voyageai.com/) embeddings. The supported models' list can be found [here](https://docs.voyageai.com/docs/embeddings).

You can generate an API key from the [Voyage AI dashboard](<https://dash.voyageai.com/>) to authenticate the requests.

### Setting up the Qdrant and Voyage clients

```python
from qdrant_client import QdrantClient
import voyageai

VOYAGE_API_KEY = "<YOUR_VOYAGEAI_API_KEY>"

qclient = QdrantClient(":memory:")
vclient = voyageai.Client(api_key=VOYAGE_API_KEY)

texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

```typescript
import {QdrantClient} from '@qdrant/js-client-rest';

const VOYAGEAI_BASE_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGEAI_API_KEY = "<YOUR_VOYAGEAI_API_KEY>"

const client = new QdrantClient({ url: 'http://localhost:6333' });

const headers = {
    "Authorization": "Bearer " + VOYAGEAI_API_KEY,
    "Content-Type": "application/json"
}

const texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

The following example shows how to embed documents with the [`voyage-large-2`](https://docs.voyageai.com/docs/embeddings#model-choices) model that generates sentence embeddings of size 1536.

### Embedding documents

```python
response = vclient.embed(texts, model="voyage-large-2", input_type="document")
```

```typescript
let body = {
    "input": texts,
    "model": "voyage-large-2",
    "input_type": "document",
}

let response = await fetch(VOYAGEAI_BASE_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers
});

let response_body = await response.json();
```

### Converting the model outputs to Qdrant points

```python
from qdrant_client.models import PointStruct

points = [
    PointStruct(
        id=idx,
        vector=embedding,
        payload={"text": text},
    )
    for idx, (embedding, text) in enumerate(zip(response.embeddings, texts))
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
});
```

### Creating a collection to insert the documents

```python
from qdrant_client.models import VectorParams, Distance

COLLECTION_NAME = "example_collection"

qclient.create_collection(
    COLLECTION_NAME,
    vectors_config=VectorParams(
        size=1536,
        distance=Distance.COSINE,
    ),
)
qclient.upsert(COLLECTION_NAME, points)
```

```typescript
const COLLECTION_NAME = "example_collection"

await client.createCollection(COLLECTION_NAME, {
    vectors: {
        size: 1536,
        distance: 'Cosine',
    }
});

await client.upsert(COLLECTION_NAME, {
    wait: true,
    points
});
```

### Searching for documents with Qdrant

Once the documents are added, you can search for the most relevant documents.

```python
response = vclient.embed(
    ["What is the best to use for vector search scaling?"],
    model="voyage-large-2",
    input_type="query",
)

qclient.search(
    collection_name=COLLECTION_NAME,
    query_vector=response.embeddings[0],
)
```

```typescript
body = {
    "input": ["What is the best to use for vector search scaling?"],
    "model": "voyage-large-2",
    "input_type": "query",
};

response = await fetch(VOYAGEAI_BASE_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers
});

response_body = await response.json();

await client.search(COLLECTION_NAME, {
    vector: response_body.data[0].embedding,
});
```
