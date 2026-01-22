---
title: "Quickstart" 
weight: 10
---

# Qdrant Edge Quickstart

## Install Qdrant Edge

First, install the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/):

```python
pip install qdrant-edge-py
```

## Create a Storage Directory

A Qdrant Edge Shard stores its data in a local directory on disk. Create the directory if it doesn't exist yet:

```python
from pathlib import Path

SHARD_DIRECTORY = "./qdrant-edge-directory"

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
```

## Configure the Edge Shard

An Edge Shard is configured with a definition of the dense and sparse vectors that can be stored in the Edge Shard, similar to how you would configure a Qdrant collection. Set up a configuration by creating an instance of `EdgeConfig`:

```python
from qdrant_edge import ( 
    Distance, 
    EdgeConfig,  
    VectorDataConfig, 
)

VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

config = EdgeConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)
```

## Initialize the Edge Shard

Now you can create an instance of `EdgeShard` with the storage directory and the configuration:

```python
from qdrant_edge import EdgeShard

edge_shard = EdgeShard(SHARD_DIRECTORY, config)
```

## Work with Points

An Edge Shard has several methods to work with points. To add points, use the `update` method:

```python
from qdrant_edge import ( Point, UpdateOperation )

point = Point(
    id=1, 
    vector={VECTOR_NAME: [0.1, 0.2, 0.3, 0.4]}, 
    payload={"color": "red"}
)

edge_shard.update(UpdateOperation.upsert_points([point]))
```

To retrieve a point by ID, use the `retrieve` method:

```python
point = edge_shard.retrieve(
    point_ids=[1], 
    with_payload=True, 
    with_vector=False
)
```

## Query Points

To query points in the Edge Shard, use the `query` method:

```python
from qdrant_edge import Query, QueryRequest

results = edge_shard.query(
    QueryRequest(
        query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
```

## Close the Edge Shard

When shutting down your application, close the Edge Shard to ensure all data is flushed to disk. The data is persisted on disk and can be used to reopen the Edge Shard.

```python
edge_shard.close()
```

## Load Existing Edge Shard from Disk

After closing an Edge Shard, you can reopen it by loading its data and configuration from disk. Create a new `EdgeShard` instance with the storage directory and provide `None` for the configuration:

```python
edge_shard = EdgeShard(SHARD_DIRECTORY)
```

## More Examples

More examples and advanced usage of Qdrant Edge API can be found in the [GitHub repository](https://github.com/qdrant/qdrant/tree/master/lib/edge/python/examples).

