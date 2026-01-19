---
title: "Synchronizing with a Server" 
weight: 20
---

# Synchronizing Qdrant Edge with a Server

A Qdrant Edge Shard can be synchronized with a collection from an external Qdrant server to support use cases like:

- **Offload indexing**: Indexing is a computationally expensive operation. By synchronizing an Edge Shard with a server collection, you can offload the indexing process to a more powerful server instance. The indexed data can then be synchronized back to the Edge Shard.
- **Back up and Restore**: Regularly back up your Edge Shard data to a central Qdrant instance to prevent data loss. In case of hardware failure or data corruption on the edge device, you can restore the data from the central instance.
- **Data Aggregation**: Collect data from multiple Edge Shards deployed in different locations and aggregate it into a central Qdrant instance for comprehensive analysis and reporting.
- **Synchronization between devices**: Keep data consistent across multiple edge devices by synchronizing their Edge Shards with a central Qdrant instance.

For an example implementation of the patterns described in this guide, refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo).

## Initialize Edge Shard from existing Qdrant Collection

First, create a snapshot on the server:

```python
import requests

snapshot_url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"
```

Note, that Qdrant Edge operates on a single shard. Therefore, when creating a snapshot for synchronization, specify shard `0` in the snapshot URL (assuming the collection has a single shard).

This allows single collection to serve multiple independent users or devices, each with its own Edge Shard. Read more about qdrant sharding strategy in the [Tiered Multitenancy Documentation](/documentation/guides/multitenancy/#tiered-multitenancy).

Using the snapshot URL, you can download the snapshot, as shown in this helper function:

```python
def download_snapshot(url: str, target_path: Path):
    with requests.get(url, headers={"api-key": QDRANT_API_KEY}, stream=True) as r:
        r.raise_for_status()
        with open(target_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
```

Finally, you can use this function to download the snapshot to the local disk and use the snapshot's data to initialize a new Edge Shard:

```python
import tempfile
import shutil

STORAGE_DIRECTORY = "./qdrant-edge-directory"

data_dir = Path(STORAGE_DIRECTORY)

with tempfile.TemporaryDirectory(dir=data_dir.parent) as restore_dir:
    snapshot_path = Path(restore_dir) / "shard.snapshot"

    download_snapshot(snapshot_url, snapshot_path)

    edge_shard = None
    if data_dir.exists():
        shutil.rmtree(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    EdgeShard.unpack_snapshot(str(snapshot_path), str(data_dir))

edge_shard = EdgeShard(str(data_dir))
```

This code first downloads the snapshot to a temporary directory. Next, the current instance of `EdgeShard` (if it existed) is destroyed by setting it to `None` and deleting its data directory. Finally, `EdgeShard.unpack_snapshot` unpacks the downloaded snapshot into the data directory, and a new instance of `EdgeShard` is created using the unpacked snapshot's data and configuration.

While restoring a snapshot, you may want to pause and buffer any ongoing data updates on the Edge Shard. Before taking the snapshot, ensure all queued data has been written to the server. After the restoration is complete, you can resume normal operations. Refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo) for an example implementation.

The `edge_shard` will use same configuration and same file structure as the source collection from which the snapshot was created, including vector and payload indexes.


<!-- ToDO -->
<!-- ## Synchronize Server-Side Changes with an Edge Shard -->
<!-- Talk about partial snapshots here -->

## Update a Server Collection from an Edge Shard

To synchronize data from an Edge Shard to a server collection, implement a dual-write mechanism in your application. When you add or update a point in the Edge Shard, simultaneously store it in a server collection using the Qdrant client.

Instead of writing to the server collection directly, you may want to set up a background job or a message queue that handles the synchronization asynchronously. The device running the Edge Shard may not always have a stable internet connection, so queuing updates ensures that data is eventually synchronized when connectivity is restored.

First, initialize:
- an Edge Shard from scratch or from server-side snapshot 
- Qdrant server connection.

<details>
<summary>Details</summary>

Initialize an Edge Shard:
```python
from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeShard,
    PayloadStorageType,
    PlainIndexConfig,
    EdgeConfig,
    VectorDataConfig,
    VectorStorageType
)

SHARD_DIRECTORY = "./qdrant-edge-directory"
VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
config = EdgeConfig(
    vector_data={
        VECTOR_NAME: VectorDataConfig(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

edge_shard = EdgeShard(SHARD_DIRECTORY, config)
```

Initialize a Qdrant client connection to the server and create the target collection if it does not exist:

```python
from qdrant_client import QdrantClient, models

server_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

COLLECTION_NAME="edge-collection"

if not server_client.collection_exists(collection_name=COLLECTION_NAME):

    server_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={VECTOR_NAME: models.VectorParams(size=VECTOR_DIMENSION, distance=models.Distance.COSINE)}
    )
```
</details>

Next, instantiate the queue that will hold the points that need to be synchronized with the server:

```python
from queue import Empty, Queue

# This is in-memory queue
# For production use cases consider persisting changes
upload_queue = Queue()
```

When adding or updating points in the Edge Shard, also enqueue the point for synchronization with the server.

```python
from qdrant_edge import ( Point, UpdateOperation )
from qdrant_client import models

id=1
vector=[0.1, 0.2, 0.3, 0.4]
payload={"color": "red"}

point = Point(
    id=1,
    vector={VECTOR_NAME: vector},
    payload={"color": "red"}
)

edge_shard.update(UpdateOperation.upsert_points([point]))

rest_point = models.PointStruct(id=id, vector={VECTOR_NAME: vector}, payload=payload)

upload_queue.put(rest_point)
```

A background worker can process the upload queue and synchronize points with the server collection.
This example uploads points in batches of up to 10 points at a time:

```python
BATCH_SIZE = 10
points_to_upload = []

while len(points_to_upload) < BATCH_SIZE:
    try:
        points_to_upload.append(upload_queue.get_nowait())
    except Empty:
        break

if points_to_upload:
    server_client.upsert(
        collection_name=COLLECTION_NAME, points=points_to_upload
    )
    # For production use cases consider handling failed uploads and retries
```
