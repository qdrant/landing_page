---
title: Quick Start
weight: 10
---

## Installation

The easiest way to use Qdrant is to run a pre-built image. To do this, make sure Docker is installed on your system.

Download image from [DockerHub](https://hub.docker.com/r/generall/qdrant):

```bash
docker pull generall/qdrant
```

And run the service inside the docker:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    generall/qdrant
```

In this case Qdrant will use default configuration and store all data under `./qdrant_storage` directory.

Now Qdrant should be accessible at [localhost:6333](http://localhost:6333)

## API

All interaction with Qdrant takes place via the REST API.

This example covers the most basic use-case - collection creation and basic vector search.
For additional information please refer to the [API documentation](https://qdrant.github.io/qdrant/redoc/index.html).

### Create collection
First - let's create a collection with dot-production metric.
```bash
curl -X POST 'http://localhost:6333/collections' \
    -H 'Content-Type: application/json' \
    --data-raw '{
        "create_collection": {
            "name": "test_collection",
            "vector_size": 4,
            "distance": "Dot"
        }
    }'
```

Expected response:
```json
{
    "result": true,
    "status": "ok",
    "time": 0.031095451
}
```

We can ensure that collection was created:
```bash
curl 'http://localhost:6333/collections/test_collection'
```

Expected response:

```
{
  "result": {
    "status": "green",
    "vectors_count": 0,
    "segments_count": 5,
    "disk_data_size": 0,
    "ram_data_size": 0,
    "config": {
      "params": {
        "vector_size": 4,
        "distance": "Dot"
      },
      "hnsw_config": { ... },
      "optimizer_config": { ... },
      "wal_config": { ... }
    }
  },
  "status": "ok",
  "time": 2.1199e-05
}
```


### Add points
Let's now add vectors with some payload:

```bash
curl -L -X POST 'http://localhost:6333/collections/test_collection?wait=true' \
    -H 'Content-Type: application/json' \
    --data-raw '{
      "upsert_points": {
        "points": [
          {"id": 1, "vector": [0.05, 0.61, 0.76, 0.74], "payload": {"city": "Berlin"}},
          {"id": 2, "vector": [0.19, 0.81, 0.75, 0.11], "payload": {"city": ["Berlin", "London"]}},
          {"id": 3, "vector": [0.36, 0.55, 0.47, 0.94], "payload": {"city": ["Berlin", "Moscow"]}},
          {"id": 4, "vector": [0.18, 0.01, 0.85, 0.80], "payload": {"city": ["London", "Moscow"]}},
          {"id": 5, "vector": [0.24, 0.18, 0.22, 0.44], "payload": {"count": 0}},
          {"id": 6, "vector": [0.35, 0.08, 0.11, 0.44]}
        ]
      }
    }'
```

Expected response:
```json
{
    "result": {
        "operation_id": 0,
        "status": "completed"
    },
    "status": "ok",
    "time": 0.000206061
}
```

### Search with filtering

Let's start with a basic request:

```bash
curl -L -X POST 'http://localhost:6333/collections/test_collection/points/search' \
    -H 'Content-Type: application/json' \
    --data-raw '{
        "vector": [0.2,0.1,0.9,0.7],
        "top": 3
    }'
```

Expected response:

```json
{
    "result": [
        { "id": 4, "score": 1.362 },
        { "id": 1, "score": 1.273 },
        { "id": 3, "score": 1.208 }
    ],
    "status": "ok",
    "time": 0.000055785
}
```

But result is different if we add a filter:

```bash
curl -L -X POST 'http://localhost:6333/collections/test_collection/points/search' \
    -H 'Content-Type: application/json' \
    --data-raw '{
      "filter": {
          "should": [
              {
                  "key": "city",
                  "match": {
                      "keyword": "London"
                  }
              }
          ]
      },
      "vector": [0.2, 0.1, 0.9, 0.7],
      "top": 3
  }'
```

Expected response:
```json
{
    "result": [
        { "id": 4, "score": 1.362 },
        { "id": 2, "score": 0.871 }
    ],
    "status": "ok",
    "time": 0.000093972
}
```
