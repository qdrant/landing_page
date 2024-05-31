---
title: Prem AI
weight: 1600
---

# Prem AI

[PremAI](https://premai.io/) is an all-in-one platform that simplifies the creation of robust, production-ready applications powered by Generative AI. By streamlining development, PremAI allows you to concentrate on enhancing user experience and driving overall growth.

Qdrant is compatible with Prem AI SDK (both Python and Javascript interfaces). We start by installing the SDKs. 

```bash
pip install premai
```

To install the npm package:

```bash
npm install @premai/prem-sdk 
```

### Import all required packages

```python
import os 
import getpass
from premai import Prem

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

if os.environ.get("PREMAI_API_KEY") is None:
    os.environ["PREMAI_API_KEY"] = getpass.getpass("PremAI API Key:")
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
QDRANT_SERVER_URL = "http://127.0.0.1:6333"
DOCUMENTS = [
    "This is a sample python document",
    "We will be using qdrant and premai python sdk"
]
```
```typescript
const PROJECT_ID = 123;
const EMBEDDING_MODEL = "text-embedding-3-large";
const COLLECTION_NAME = "prem-collection-js";
const SERVER_URL = "http://127.0.0.1:6333"
const DOCUMENTS = [
    "This is a sample javascript document",
    "We will be using qdrant and premai javascript sdk"
];
```

### Setup PremAI and Qdrant clients


```python
api_key = os.environ["PREMAI_API_KEY"]
prem_client = Prem(api_key=api_key)
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
```

### Convert Embeddings to Qdrant Points


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

const embeddings = await getEmbeddings(project_id, embedding_model, texts);
const points = convertToQdrantPoints(embeddings, texts);
```

### Setting up Qdrant Collection

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

### Insert Documents to the Collection

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

### Searching for documents from a query in a collection

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