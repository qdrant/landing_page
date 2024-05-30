---
title: Prem AI
weight: 1000
---

# Prem AI

[PremAI](https://premai.io/) is an all-in-one platform that simplifies the creation of robust, production-ready applications powered by Generative AI. By streamlining the development process, PremAI allows you to concentrate on enhancing user experience and driving overall growth for your application. You can quickly start using our platform [here](https://docs.premai.io/quick-start).

Qdrant is compatible with Prem AI SDK (both Python and Javascript interfaces). We start by installing the SDKs. Here is how you install premai Python SDK. 

```bash
pip install premai
```

To install the npm package, type this command:

```bash
npm install @premai/prem-sdk 
```

### Import all required packages

Let's import all our required packages. Here is how you do that for python

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

To set up our constants, we need to define `project_id` and `embedding_model` for Prem. You can find details on obtaining your `project_id` and API Key [here](https://docs.premai.io/quick-start).


```python
# Note: project_id: 123 is a dummy project id
# You need to have an actual project ID here. Otherwise, it will throw an error.

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

Once we defined all our constants, it’s time to instantiate Prem AI client and Qdrant client. Heres how you do it in both Python and JavaScript. 

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

### Writing a simple helper function to fetch embeddings from documents

Let’s write a simple function to fetch embeddings from document or a list of documents. This process will be done using Prem SDK. We then use this function to embed all our documents, before pushing it to Qdrant’s vector database. 

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

Once we are done fetching our embedding vectors with our embedding function, we convert this to Qdrant points. After this, we will use this points to upsert into our Qdrant vector DB collection. 

**Python**

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

**JavaScript**

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

// Usage 

let points = null
try {
    const embeddings = await getEmbeddings(project_id, embedding_model, texts)
    points = convertToQdrantPoints(embeddings, texts)
} catch (error) {
    points = null
    console.error('Error fetching embeddings:', error);
}
```

### Setting up Qdrant Collection

> A collection is a named set of points (vectors with a payload) among which you can search.
> 

If you already have a collection then you can skip this step, otherwise follow the code to create a Qdrant collection. We will be upserting our points in this collection. 

**Python**

```python
qdrant_client.create_collection(
    collection_name=COLLECTION_NAME, 
    vectors_config=VectorParams(size=3072, distance=Distance.DOT)
)
```
```typescript
await qdrant_client.createCollection(COLLECTION_NAME, {
    vectors: {
        size: 3072,
        distance: 'Cosine'
    }
})
```

### Insert Documents to the Collection

Once we have done making our collection, we upload all our document vectors in that collection. Here is how we do that

**Python**

```python
doc_ids = list(range(len(embeddings)))

qdrant_client.upsert(
    collection_name=COLLECTION_NAME, 
    points=points
 )
```

```typescript
if (points != null) {
    // Now upsert the points to the vector DB 
    await qdrant_client.upsert(COLLECTION_NAME, {
        wait: true,
        points
    })
    console.log("All the points are upserted to: ", COLLECTION_NAME)
}
```

### Searching for documents from a query in a collection

Once our collection is indexed with all our documents, we are now ready to query it and search documents which are semantically similar to the query. Here’s how we do this. 

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

let response = await qdrantClient.search(COLLECTION_NAME, {
    vector: query_embedding_response.data[0].embedding
})

console.log(response)
```