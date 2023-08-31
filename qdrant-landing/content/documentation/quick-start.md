---
title: Quickstart
weight: 11
aliases:
  - quick_start
---
# Quickstart

## Recommended Workflow

There are two ways of using Qdrant locally: [1) Local Mode](#option-1-local-mode) and [2) Docker Mode](#option-2-docker-mode). We recommend that you first try Local Mode in [Qdrant Client](https://github.com/qdrant/qdrant-client), as it only takes a few moments to get setup. Then, you may further experiment with Qdrant Docker containers. When you are more comfortable with Qdrant, then you should deploy your app to a Free Tier [Qdrant Cloud](../cloud/quickstart-cloud/) cluster.

|[Local Mode](#option-1-local-mode)|[Docker Mode](#option-2-docker-mode)|[Qdrant Cloud](../cloud/quickstart-cloud/)|
|:-:|:-:|:-:|

![Local mode workflow](/docs/recommended.png)

## Option 1: Local Mode

**Prerequisite:** First make sure you have the latest version of Python installed. 

### Install Qdrant

```bash
pip install qdrant-client
```

### Initialize Qdrant Client 

```python
from qdrant_client import QdrantClient

client = QdrantClient(":memory:")
# or
client = QdrantClient(path="path/to/db")  # Persists changes to disk
```

## Option 2: Docker Mode

**Prerequisite:** First make sure Docker is installed and running on your system.

### Download the image

```bash
docker pull qdrant/qdrant
```

### Run the service

```bash
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

Under the default configuration all data will be stored in the `./qdrant_storage` directory.

Qdrant should now be accessible at [localhost:6333](http://localhost:6333)

<aside role="status">Qdrant has no encryption or authentication by default and new instances are open to everyone. Please read <a href="https://qdrant.tech/documentation/security/">Security</a> carefully for details on how to secure your instance.</aside>

# Running vector search queries

In this simple example, you will create a Qdrant collection, load data into it and run a basic search query. 

![Qdrant Quickstart](/docs/quickstart.png)

## Step 1. Create a collection

You will be storing all of your vector data in a Qdrant collection. Let's call it `test_collection`. This collection will be using a doc production metric. 

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

# specify port if using Docker 
# client = QdrantClient("localhost", port=6333)
client.recreate_collection(
    collection_name="test_collection",
    vectors_config=VectorParams(size=4, distance=Distance.DOT),
)
```

**Response:**

```python
True
```

## Step 2: Add vectors

Let's now add a few vectors with a payload:

```python
from qdrant_client.http.models import PointStruct

operation_info = client.upsert(
    collection_name="test_collection",
    wait=True,
    points=[
        PointStruct(id=1, vector=[0.05, 0.61, 0.76, 0.74], payload={"city": "Berlin"}),
        PointStruct(id=2, vector=[0.19, 0.81, 0.75, 0.11], payload={"city": ["Berlin", "London"]}),
        PointStruct(id=3, vector=[0.36, 0.55, 0.47, 0.94], payload={"city": ["Berlin", "Moscow"]}),
        PointStruct(id=4, vector=[0.18, 0.01, 0.85, 0.80], payload={"city": ["London", "Moscow"]}),
        PointStruct(id=5, vector=[0.24, 0.18, 0.22, 0.44], payload={"count": [0]}),
        PointStruct(id=6, vector=[0.35, 0.08, 0.11, 0.44]),
    ]
)
print(operation_info)
```

**Response:**

```python
operation_id=0 status=<UpdateStatus.COMPLETED: 'completed'>
```

## Step 3: Run a query
Let's ask a basic question - Which of our stored vectors are most similar to the query vector `[0.2, 0.1, 0.9, 0.7]`?

```python
search_result = client.search(
    collection_name="test_collection",
    query_vector=[0.2, 0.1, 0.9, 0.7], 
    limit=3
)
print(search_result)
```

**Response:**

```python
ScoredPoint(id=4, version=0, score=1.362000031210482, payload={'city': ['London', 'Moscow']}, vector=None), 
ScoredPoint(id=1, version=0, score=1.2729999996721744, payload={'city': 'Berlin'}, vector=None), 
ScoredPoint(id=3, version=0, score=1.2080000013113021, payload={'city': ['Berlin', 'Moscow']}, vector=None)
```

Note that payload and vector data is missing in these results by default.
See [payload and vector in the result](../concepts/search#payload-and-vector-in-the-result) on how to enable it.

## Step 4: Add a filter

We can narrow down the results further by filtering by payload. Let's find the closest results that include "London".

```python
from qdrant_client.http.models import Filter, FieldCondition, MatchValue


search_result = client.search(
    collection_name="test_collection",
    query_vector=[0.2, 0.1, 0.9, 0.7], 
    query_filter=Filter(
        must=[
            FieldCondition(
                key="city",
                match=MatchValue(value="London")
            )
        ]
    ),
    limit=3
)
print(search_result)
```

**Response:**

```python
ScoredPoint(id=4, version=0, score=1.362000031210482, payload={'city': ['London', 'Moscow']}, vector=None), 
ScoredPoint(id=2, version=0, score=0.8709999993443489, payload={'city': ['Berlin', 'London']}, vector=None)
```

You have just conducted vector search. You loaded vectors into a database and queried the database with a vector of your own. Qdrant found the closest results and presented you with a similarity score. 

## Next Steps

Now you know how Qdrant works. Getting started with [Qdrant Cloud](../cloud/quickstart-cloud/)| is even simpler. [Create an account](https://qdrant.to/cloud) and use our SaaS completely free. We will take care of infrastructure maintenance and software updates. 

To move onto some more complex examples of vector search, read our [Tutorials](../tutorials/) and create your own app with the help of our [Examples](../examples/). 
