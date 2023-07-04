---
title: Quickstart
weight: 11
aliases:
  - quick_start
---

# Quickstart

## 1. Install Qdrant 

```python
pip install qdrant-client
```

## 2. Initialize client

```python
from qdrant_client import models, QdrantClient
client = QdrantClient(":memory:")
```

## 3. Create a collection

```python
from qdrant_client.http.models import Distance, VectorParams

client = QdrantClient("localhost", port=6333)
client.recreate_collection(
    collection_name="test_collection",
    vectors_config=VectorParams(size=4, distance=Distance.DOT),
)
```

## 4. Add vectors 

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
```

## 5. Run a query

```python
search_result = client.search(
    collection_name="test_collection",
    query_vector=[0.2, 0.1, 0.9, 0.7], 
    limit=3
)
```

## 6. Add a filter

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
```

## Next Steps

![Local mode workflow](https://raw.githubusercontent.com/qdrant/qdrant-client/master/docs/images/try-develop-deploy.png)

The easiest way to use Qdrant is to run a pre-built image. To do this, make sure Docker is installed on your system.

Download image from [DockerHub](https://hub.docker.com/r/qdrant/qdrant):

```bash
docker pull qdrant/qdrant
```

And run the service inside the docker:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

In this case Qdrant will use default configuration and store all data under `./qdrant_storage` directory.

Now Qdrant should be accessible at [localhost:6333](http://localhost:6333)

<aside role="status">Qdrant has no encryption or authentication by default and new instances are open to everyone. Please read <a href="https://qdrant.tech/documentation/security/">Security</a> carefully for details on how to secure your instance.</aside>

Local mode is useful for development, prototyping and testing.

* You can use it to run tests in your CI/CD pipeline.
* Run it in Colab or Jupyter Notebook, no extra dependencies required. See a [Colab Example](https://colab.research.google.com/drive/1Bz8RSVHwnNDaNtDwotfPj0w7AYzsdXZ-?usp=sharing)
* When you need to scale, simply switch to server mode.




