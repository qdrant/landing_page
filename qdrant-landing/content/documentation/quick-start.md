---
title: Quickstart
weight: 11
aliases:
  - quick_start
---

# Quickstart

**Recommended Workflow:** 

First, test Qdrant locally using the [Qdrant Client](https://github.com/qdrant/qdrant-client) and with the help of our [Tutorials](tutorials/). Then, develop a sample app from our [Examples](examples/) list and try it using a [Qdrant Docker](guides/installation/) container. Finally, when you are ready for production, deploy to a Free Tier [Qdrant Cloud](cloud/) cluster.

![Local mode workflow](https://raw.githubusercontent.com/qdrant/qdrant-client/master/docs/images/try-develop-deploy.png)

## Local Mode

Local mode is useful for development, prototyping and testing. You can run this Quickstart in Colab or Jupyter Notebook. 

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

