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

STORAGE_DIRECTORY = "edge-storage"

Path(STORAGE_DIRECTORY).mkdir(parents=True, exist_ok=True)
```

## Configure the Shard

An Edge Shard is configured with a definition of the dense and sparse vectors that can be stored in the shard, similar to how you would configure a Qdrant collection. Set up a configuration by creating an instance of `SegmentConfig`:

```python
from qdrant_edge import ( 
    Distance, 
    PayloadStorageType, 
    PlainIndexConfig, 
    SegmentConfig,  
    VectorDataConfig, 
    VectorStorageType 
)

VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

config = SegmentConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
            storage_type=VectorStorageType.ChunkedMmap,
            index=PlainIndexConfig(),
            quantization_config=None,
            multivector_config=None,
            datatype=None,
        )
    },
    sparse_vector_data={},
    payload_storage_type=PayloadStorageType.InRamMmap,
)
```

## Initialize the Shard

Now you can create an instance of `Shard` with the storage directory and the configuration:

```python
from qdrant_edge import Shard

shard = Shard(STORAGE_DIRECTORY, config)
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

shard.update(UpdateOperation.upsert_points([point]))
```

To retrieve a point by ID, use the `retrieve` method:

```python
point = shard.retrieve(
    point_ids=[1], 
    with_payload=True, 
    with_vector=False
)
```

## Query Points

To query points in the shard, use the `query` method:

```python
from qdrant_edge import Query, QueryRequest

results = shard.query(
    QueryRequest(
        query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
        limit=10,
        with_vector=False,
        with_payload=True
    )
)
```

## Close the Shard

When shutting down your application, close the shard to ensure all data is flushed to disk. The data is persisted on disk and can be used to create another shard.

```python
shard.close()
```

## Load Existing Shard from Disk

After closing a shard, you can reopen it by loading its data and configuration from disk. Create a new `Shard` instance with the storage directory and provide `None` for the configuration:

```python
shard = Shard(STORAGE_DIRECTORY, None)
```
