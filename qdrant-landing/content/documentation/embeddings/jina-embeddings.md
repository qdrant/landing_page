---
title: Jina Embeddings
aliases: 
  - /documentation/embeddings/jina-embeddings/
  - /documentation/integrations/jina-embeddings/
---

# Jina Embeddings

Qdrant is compatible with [Jina AI](https://jina.ai/) embeddings. You can get a free trial key from [Jina Embeddings](https://jina.ai/embeddings/) to get embeddings.

Qdrant users can receive a 10% discount on Jina AI APIs by using the code **QDRANT**.

## Technical Summary

|  Model | Dimension  |  Language |  MRL (matryoshka) | Context |
|:----------------------:|:---------:|:---------:|:-----------:|:---------:|
| **jina-clip-v2** | **1024** | **Multilingual (100+, focus on 30)** | **Yes** | **Text/Image** |
|  jina-embeddings-v3  |  1024 | Multilingual (89 languages)  |  Yes  | 8192 |
|  jina-embeddings-v2-base-en |  768 |  English |  No | 8192  |
|  jina-embeddings-v2-base-de |  768 |  German & English |  No  |  8192 |
|  jina-embeddings-v2-base-es |  768 |  Spanish & English |  No  |  8192 |
|  jina-embeddings-v2-base-zh | 768  |  Chinese & English |  No  |  8192 |

> Jina recommends using `jina-embeddings-v3` for text-only tasks and `jina-clip-v2` for multimodal tasks or when enhanced visual retrieval is required.

On top of the backbone, `jina-embeddings-v3` has been trained with 5 task-specific adapters for different embedding uses. Include `task` in your request to optimize your downstream application:

+ **retrieval.query**: Used to encode user queries or questions in retrieval tasks.
+ **retrieval.passage**: Used to encode large documents in retrieval tasks at indexing time.
+ **classification**: Used to encode text for text classification tasks.
+ **text-matching**: Used to encode text for similarity matching, such as measuring similarity between two sentences.
+ **separation**: Used for clustering or reranking tasks.

`jina-embeddings-v3` and `jina-clip-v2` support **Matryoshka Representation Learning**, allowing users to control the embedding dimension with minimal performance loss.  
Include `dimensions` in your request to select the desired dimension.  
By default, **dimensions** is set to 1024, and a number between 256 and 1024 is recommended.  
You can reference the table below for hints on dimension vs. performance:

|         Dimension          | 32 |  64  | 128 |  256   |  512   |   768 |  1024   |
|:----------------------:|:---------:|:---------:|:-----------:|:---------:|:----------:|:---------:|:---------:|
|  Average Retrieval Performance (nDCG@10)   |   52.54     | 58.54 |    61.64    | 62.72 | 63.16  | 63.3  |   63.35    |

`jina-embeddings-v3` supports [Late Chunking](https://jina.ai/news/late-chunking-in-long-context-embedding-models/), the technique to leverage the model's long-context capabilities for generating contextual chunk embeddings. Include `late_chunking=True` in your request to enable contextual chunked representation. When set to true, Jina AI API will concatenate all sentences in the input field and feed them as a single string to the model. Internally, the model embeds this long concatenated string and then performs late chunking, returning a list of embeddings that matches the size of the input list.

## Example

### Jina Embeddings v3

The code below demonstrates how to use `jina-embeddings-v3` with Qdrant:

```python
import requests

import qdrant_client
from qdrant_client.models import Distance, VectorParams, Batch

# Provide Jina API key and choose one of the available models.
JINA_API_KEY = "jina_xxxxxxxxxxx"
MODEL = "jina-embeddings-v3"
DIMENSIONS = 1024 # Or choose your desired output vector dimensionality.
TASK = 'retrieval.passage' # For indexing, or set to retrieval.query for querying

# Get embeddings from the API
url = "https://api.jina.ai/v1/embeddings"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JINA_API_KEY}",
}

data = {
    "input": ["Your text string goes here", "You can send multiple texts"],
    "model": MODEL,
    "dimensions": DIMENSIONS,
    "task": TASK,
    "late_chunking": True,
}

response = requests.post(url, headers=headers, json=data)
embeddings = [d["embedding"] for d in response.json()["data"]]


# Index the embeddings into Qdrant
client = qdrant_client.QdrantClient(":memory:")
client.create_collection(
    collection_name="MyCollection",
    vectors_config=VectorParams(size= DIMENSIONS, distance=Distance.DOT),
)


qdrant_client.upsert(
    collection_name="MyCollection",
    points=Batch(
        ids=list(range(len(embeddings))),
        vectors=embeddings,
    ),
)

```

### Jina CLIP v2

The code below demonstrates how to use `jina-clip-v2` with Qdrant:

```python
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Provide your Jina API key and choose the model.
JINA_API_KEY = "jina_xxxxxxxxxxx"
MODEL = "jina-clip-v2"
DIMENSIONS = 1024  # Set the desired output vector dimensionality.

# Define the inputs
text_input = "A blue cat"
image_url = "https://i.pinimg.com/600x315/21/48/7e/21487e8e0970dd366dafaed6ab25d8d8.jpg"

# Get embeddings from the Jina API
url = "https://api.jina.ai/v1/embeddings"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JINA_API_KEY}",
}
data = {
    "input": [
        {"text": text_input},
        {"image": image_url},
    ],
    "model": MODEL,
    "dimensions": DIMENSIONS,
}

response = requests.post(url, headers=headers, json=data)
response_data = response.json()["data"]

# The model doesn't differentiate between images and text, so we extract output based on the input order.
text_embedding = response_data[0]["embedding"]
image_embedding = response_data[1]["embedding"]

# Initialize Qdrant client
client = QdrantClient(url="http://localhost:6333/")

# Create a collection with named vectors
collection_name = "MyCollection"
client.recreate_collection(
    collection_name=collection_name,
    vectors_config={
        "text_vector": VectorParams(size=DIMENSIONS, distance=Distance.DOT),
        "image_vector": VectorParams(size=DIMENSIONS, distance=Distance.DOT),
    },
)

client.upsert(
    collection_name=collection_name,
    points=[
        PointStruct(
            id=0,
            vector={
                "text_vector": text_embedding,
                "image_vector": image_embedding,
            }
        )
    ],
)

# Now let's query the collection
search_query = "A purple cat"

# Get the embedding for the search query from the Jina API
url = "https://api.jina.ai/v1/embeddings"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JINA_API_KEY}",
}
data = {
    "input": [{"text": search_query}],
    "model": MODEL,
    "dimensions": DIMENSIONS,
    # "task": "retrieval.query" # Uncomment this line for text-to-text retrieval tasks
}

response = requests.post(url, headers=headers, json=data)
query_embedding = response.json()["data"][0]["embedding"]

search_results = client.query_points(
    collection_name=collection_name,
    query=query_embedding,
    using="image_vector",
    limit=5
).points

for result in search_results:
    print(f"ID: {result.id}, Score: {result.score}")
```
