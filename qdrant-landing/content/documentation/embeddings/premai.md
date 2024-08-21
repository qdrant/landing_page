---
title: Prem AI
weight: 2800
---

# Prem AI

[PremAI](https://premai.io/) is a unified generative AI development platform for fine-tuning deploying, and monitoring AI models.

Qdrant is compatible with PremAI APIs.

### Installing the SDKs

```bash
pip install premai qdrant-client
```

To install the npm package:

```bash
npm install @premai/prem-sdk @qdrant/js-client-rest
```

### Import all required packages

```python
from premai import Prem

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
```

```typescript
import Prem from '@premai/prem-sdk';
import { QdrantClient } from '@qdrant/js-client-rest';
```

### Define all the constants

We need to define the project ID and the embedding model to use. You can learn more about obtaining these in the PremAI [docs](https://docs.premai.io/quick-start).


```python
PROJECT_ID = 123
EMBEDDING_MODEL = "text-embedding-3-large"
COLLECTION_NAME = "prem-collection-py"
QDRANT_SERVER_URL = "http://localhost:6333"
DOCUMENTS = [
    "This is a sample python document",
    "We will be using qdrant and premai python sdk"
]
```

```typescript
const PROJECT_ID = 123;
const EMBEDDING_MODEL = "text-embedding-3-large";
const COLLECTION_NAME = "prem-collection-js";
const SERVER_URL = "http://localhost:6333"
const DOCUMENTS = [
    "This is a sample javascript document",
    "We will be using qdrant and premai javascript sdk"
];
```

### Set up PremAI and Qdrant clients


```python
prem_client = Prem(api_key="xxxx-xxx-xxx")
qdrant_client = QdrantClient(url=QDRANT_SERVER_URL)
```

```typescript
const premaiClient = new Prem({
    apiKey: "xxxx-xxx-xxx"
})
const qdrantClient = new QdrantClient({ url: SERVER_URL });
```

### Generating Embeddings

```python
from typing import Union, List

def get_embeddings(
    project_id: int, 
    embedding_model: str, 
    documents: Union[str, List[str]]
) -> List[List[float]]:
    """
    Helper function to get the embeddings from premai sdk 
    Args
        project_id (int): The project id from prem saas platform.
        embedding_model (str): The embedding model alias to choose
        documents (Union[str, List[str]]): Single texts or list of texts to embed
    Returns:
        List[List[int]]: A list of list of integers that represents different
            embeddings
    """
    embeddings = []
    documents = [documents] if isinstance(documents, str) else documents 
    for embedding in prem_client.embeddings.create(
        project_id=project_id,
        model=embedding_model, 
        input=documents
    ).data:
        embeddings.append(embedding.embedding)
    
    return embeddings
```

```typescript
async function getEmbeddings(projectID, embeddingModel, documents) {
    const response = await premaiClient.embeddings.create({
        project_id: projectID,
        model: embeddingModel,
        input: documents
    });
    return response;
}
```

### Converting Embeddings to Qdrant Points


```python
from qdrant_client.models import PointStruct

embeddings = get_embeddings(
    project_id=PROJECT_ID,
    embedding_model=EMBEDDING_MODEL, 
    documents=DOCUMENTS 
)

points = [
    PointStruct(
        id=idx, 
        vector=embedding,
        payload={"text": text},
    ) for idx, (embedding, text) in enumerate(zip(embeddings, DOCUMENTS))
]
```

```typescript
function convertToQdrantPoints(embeddings, texts) {
    return embeddings.data.map((data, i) => {
        return {
            id: i,
            vector: data.embedding,
            payload: {
                text: texts[i]
            }
        };
    });
}

const embeddings = await getEmbeddings(PROJECT_ID, EMBEDDING_MODEL, DOCUMENTS);
const points = convertToQdrantPoints(embeddings, DOCUMENTS);
```

### Set up a Qdrant Collection

```python
qdrant_client.create_collection(
    collection_name=COLLECTION_NAME, 
    vectors_config=VectorParams(size=3072, distance=Distance.DOT)
)
```
```typescript
await qdrantClient.createCollection(COLLECTION_NAME, {
    vectors: {
        size: 3072,
        distance: 'Cosine'
    }
})
```

### Insert Documents into the Collection

```python
doc_ids = list(range(len(embeddings)))

qdrant_client.upsert(
    collection_name=COLLECTION_NAME, 
    points=points
 )
```

```typescript
await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points
    });
```

### Perform a Search

```python
query = "what is the extension of python document"

query_embedding = get_embeddings(
    project_id=PROJECT_ID, 
    embedding_model=EMBEDDING_MODEL, 
    documents=query
)

qdrant_client.search(collection_name=COLLECTION_NAME, query_vector=query_embedding[0])
```
```typescript
const query = "what is the extension of javascript document"
const query_embedding_response = await getEmbeddings(PROJECT_ID, EMBEDDING_MODEL, query)

await qdrantClient.search(COLLECTION_NAME, {
    vector: query_embedding_response.data[0].embedding
});
```
