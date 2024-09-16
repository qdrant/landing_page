---
title: Jina Embeddings
weight: 1900
aliases: 
  - /documentation/embeddings/jina-emebddngs/
  - ../integrations/jina-embeddings/
---

# Jina Embeddings

Qdrant is compatible with [Jina AI](https://jina.ai/) embeddings. You need an API key from [Jina AI](https://jina.ai/embeddings/) to get embeddings.

For Qdrant users, use code **QDRANT** for a 10% discount on Jina AI APIs.

## Technical Summary

|  Model | Dimension  |  Language |  MRL (matryoshka) | Context |
|:----------------------:|:---------:|:---------:|:-----------:|:---------:|
|  jina-embeddings-v3  |  1024 | Multilingual (89 languages)  |  Yes  | 8192 |
|  jina-embeddings-v2-base-en |  768 |  English |  No | 8192  | 
|  jina-embeddings-v2-base-de |  768 |  German & English |  No  |  8192 | 
|  jina-embeddings-v2-base-es |  768 |  Spanish & English |  No  |  8192 | 
|  jina-embeddings-v2-base-zh | 768  |  Chinese & English |  No  |  8192 | 

> Jina recommend using `jina-embeddings-v3` as it is the latest and most performant embedding model released by Jina AI.

On top of the backbone, `jina-embeddings-v3` has been trained with 5 task-specific adapters for different embedding uses. Include `task_type` in your request to optimize your downstream application:

+ **retrieval.query**: Used to encode user queries or questions in retrieval tasks.
+ **retrieval.passage**: Used to encode large documents in retrieval tasks at indexing time.
+ **classification**: Used to encode text for text classification tasks.
+ **text-matching**: Used to encode text for similarity matching, such as measuring similarity between two sentences.
+ **separation**: Used for clustering or reranking tasks.

`jina-embeddings-v3` supports **Matryoshka Representation Learning**, allowing users to control the embedding dimension with minimal performance loss.  
Include `dimensions` in your request to select the desired dimension.  
By default, **dimensions** is set to 1024, and a number between 256 and 1024 is recommended.  
You can reference the table below for hints on dimension vs. performance:


|         Dimension          | 32 |  64  | 128 |  256   |  512   |   768 |  1024   | 
|:----------------------:|:---------:|:---------:|:-----------:|:---------:|:----------:|:---------:|:---------:|
|  Average Retrieval Performance (nDCG@10)   |   52.54     | 58.54 |    61.64    | 62.72 | 63.16  | 63.3  |   63.35    | 


## Guide

The code below demonstrate how to use `jina-embeddings-v3` together with Qdrant:


```python
import requests

import qdrant_client
from qdrant_client.models import Distance, VectorParams, Batch

# Provide Jina API key and choose one of the available models.
# You can get a free trial key here: https://jina.ai/embeddings/
JINA_API_KEY = "jina_xxxxxxxxxxx"
MODEL = "jina-embeddings-v3"
DIMENSIONS = 1024 # Or choose your desired output vector dimensionality.
TASK_TYPE = 'retrieval.passage' # For indexing, or set to retrieval.query for quering

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
    "task_type": TASK_TYPE,
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
