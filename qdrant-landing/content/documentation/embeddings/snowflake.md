---
title: Snowflake Models
---

# Snowflake

Qdrant supports working with [Snowflake](https://www.snowflake.com/blog/introducing-snowflake-arctic-embed-snowflakes-state-of-the-art-text-embedding-family-of-models/) text embedding models. You can find all the available models on [HuggingFace](https://huggingface.co/Snowflake).

### Setting up the Qdrant and Snowflake models

```python
from qdrant_client import QdrantClient
from fastembed import TextEmbedding

qclient = QdrantClient(":memory:")
embedding_model = TextEmbedding("snowflake/snowflake-arctic-embed-s")

texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

```typescript
import {QdrantClient} from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';

const client = new QdrantClient({ url: 'http://localhost:6333' });

const extractor = await pipeline('feature-extraction', 'Snowflake/snowflake-arctic-embed-s');

const texts = [
    "Qdrant is the best vector search engine!",
    "Loved by Enterprises and everyone building for low latency, high performance, and scale.",
]
```

The following example shows how to embed documents with the [`snowflake-arctic-embed-s`](https://huggingface.co/Snowflake/snowflake-arctic-embed-s) model that generates sentence embeddings of size 384.

### Embedding documents

```python
embeddings = embedding_model.embed(texts)
```

```typescript
const embeddings = await extractor(texts, { normalize: true, pooling: 'cls' });
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
    for idx, (embedding, text) in enumerate(zip(embeddings, texts))
]
```

```typescript
let points = embeddings.tolist().map((embedding, i) => {
    return {
        id: i,
        vector: embedding,
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
        size=384,
        distance=Distance.COSINE,
    ),
)
qclient.upsert(COLLECTION_NAME, points)
```

```typescript
const COLLECTION_NAME = "example_collection"

await client.createCollection(COLLECTION_NAME, {
    vectors: {
        size: 384,
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
query_embedding = next(embedding_model.query_embed("What is the best to use for vector search scaling?"))

qclient.search(
    collection_name=COLLECTION_NAME,
    query_vector=query_embedding,
)
```

```typescript
const query_embedding = await extractor("What is the best to use for vector search scaling?", {
    normalize: true,
    pooling: 'cls'
});

await client.search(COLLECTION_NAME, {
    vector: query_embedding.tolist()[0],
});
```
