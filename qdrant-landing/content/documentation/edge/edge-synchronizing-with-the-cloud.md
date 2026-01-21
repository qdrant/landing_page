---
title: "Synchronizing with a Server" 
weight: 20
---

# Synchronizing Qdrant Edge with a Server

Qdrant Edge can be synchronized with a collection from an external Qdrant server to support use cases like:

- **Offload indexing**: Indexing is a computationally expensive operation. By synchronizing an Edge Shard with a server collection, you can offload the indexing process to a more powerful server instance. The indexed data can then be synchronized back to the Edge Shard.
- **Back up and Restore**: Regularly back up your Edge Shard data to a central Qdrant instance to prevent data loss. In case of hardware failure or data corruption on the edge device, you can restore the data from the central instance.
- **Data Aggregation**: Collect data from multiple Edge Shards deployed in different locations and aggregate it into a central Qdrant instance for comprehensive analysis and reporting.
- **Synchronization between devices**: Keep data consistent across multiple edge devices by synchronizing their Edge Shards with a central Qdrant instance.

For an example implementation of the patterns described in this guide, refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo).

## Initialize Edge Shard from existing Qdrant Collection

Instead of starting with an empty Edge Shard, you may want to initialize it with pre-existing data from a collection on a Qdrant server. You can achieve this by restoring a snapshot of a shard in the server-side collection.

When creating a snapshot for synchronization, specify the applicable server-side shard ID in the snapshot URL. This allows for a single collection to serve multiple independent users or devices, each with its own Edge Shard. Read more about Qdrant's sharding strategy in the [Tiered Multitenancy Documentation](/documentation/guides/multitenancy/#tiered-multitenancy).

First, craft a snapshot URL:

```python
COLLECTION_NAME="edge-collection"

snapshot_url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"
```

Note that this example uses shard ID `0`.

Using the snapshot URL, you can download the snapshot to the local disk and use its data to initialize a new Edge Shard.

```python
from pathlib import Path
from qdrant_edge import EdgeShard
import requests
import shutil
import tempfile

SHARD_DIRECTORY = "./qdrant-edge-directory"
data_dir = Path(SHARD_DIRECTORY)

with tempfile.TemporaryDirectory(dir=data_dir.parent) as restore_dir:
    snapshot_path = Path(restore_dir) / "shard.snapshot"

    with requests.get(snapshot_url, headers={"api-key": QDRANT_API_KEY}, stream=True) as r:
        r.raise_for_status()
        with open(snapshot_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    if data_dir.exists():
        shutil.rmtree(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    EdgeShard.unpack_snapshot(str(snapshot_path), str(data_dir))

edge_shard = EdgeShard(SHARD_DIRECTORY)
```

This code first downloads the snapshot to a temporary directory. Next, `EdgeShard.unpack_snapshot` unpacks the downloaded snapshot into the data directory, and a new instance of `EdgeShard` is created using the unpacked snapshot's data and configuration.

The `edge_shard` will use the same configuration and the same file structure as the source collection from which the snapshot was created, including vector and payload indexes.

## Update Qdrant Edge with Server-Side Changes

To keep an Edge Shard updated with new data from a server collection, you can periodically download and apply a snapshot. Restoring a full snapshot every time would create unnecessary overhead. Instead, you can use partial snapshots to restore changes since the last snapshot. A partial snapshot contains only those segments that have changed, based on the Edge Shard's manifest that describes all its segments and metadata. The `EdgeShard` class provides an `update_from_snapshot` method to update an Edge Shard from a partial snapshot.

```Python
manifest = edge_shard.snapshot_manifest()

url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot/partial/create"

with tempfile.TemporaryDirectory(dir=data_dir) as temp_dir:
    partial_snapshot_path = Path(temp_dir) / "partial.snapshot"
    response = requests.post(url, headers={"api-key": QDRANT_API_KEY}, json=manifest, stream=True)
    response.raise_for_status()
    
    with open(partial_snapshot_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    edge_shard.update_from_snapshot(str(partial_snapshot_path))
```

## Update a Server Collection from an Edge Shard

To synchronize data from an Edge Shard to a server collection, implement a dual-write mechanism in your application. When you add or update a point in the Edge Shard, simultaneously store it in a server collection using the Qdrant client.

Instead of writing to the server collection directly, you may want to set up a background job or a message queue that handles the synchronization asynchronously. The device running the Edge Shard may not always have a stable internet connection, so queuing updates ensures that data is eventually synchronized when connectivity is restored.

First, initialize:
- an Edge Shard from scratch or from server-side snapshot 
- a Qdrant server connection.

<details>
<summary>Details</summary>

Initialize an Edge Shard:
```python
from pathlib import Path
from qdrant_edge import ( 
    Distance, 
    EdgeConfig,  
    VectorDataConfig, 
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
    id=id,
    vector={VECTOR_NAME: vector},
    payload=payload
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
```

Make sure to properly handle errors and retries in case of network issues or server unavailability.

## Combine Local Updates with Server Synchronization

To support having local updates from the device as well as updates from a server, you can implement a setup with two Edge Shards:

- A **mutable** Edge Shard that handles local data updates.
- An **immutable** Edge Shard that mirrors a shard from a collection on a server using partial snapshots.

When querying data, merge results from both Edge Shards to provide a unified view. This way, new points added on the device are available for search alongside the data synchronized from the server.

Implementing a dual-write mechanism that writes data to both the mutable Edge Shard and the server collection ensures that data is indexed on the server and synchronized back to the immutable Edge Shard, benefitting search performance.

### 1. Initialize a Mutable Edge Shard

The mutable Edge Shard will manage local data updates. It can be initialized from scratch, as detailed in the [Qdrant Edge Quickstart Guide](/documentation/edge/edge-quickstart/).

```python
from pathlib import Path
from qdrant_edge import ( 
    Distance,
    EdgeConfig,
    EdgeShard,
    VectorDataConfig,
)

MUTABLE_SHARD_DIR = "./qdrant-edge-directory/mutable"

Path(MUTABLE_SHARD_DIR).mkdir(parents=True, exist_ok=True)

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

mutable_shard = EdgeShard(MUTABLE_SHARD_DIR, config)
```

### 2. Initialize an Immutable Edge Shard from a Server Snapshot

Next, create the immutable Edge Shard from a snapshot on the server, as outlined in [Initialize Edge Shard from existing Qdrant Collection](#initialize-edge-shard-from-existing-qdrant-collection):

```python
import requests
import tempfile
import shutil

COLLECTION_NAME="edge-collection"
snapshot_url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"

IMMUTABLE_SHARD_DIR = "./qdrant-edge-directory/mutable"
data_dir = Path(IMMUTABLE_SHARD_DIR)

with tempfile.TemporaryDirectory(dir=data_dir.parent) as restore_dir:
    snapshot_path = Path(restore_dir) / "shard.snapshot"

    with requests.get(snapshot_url, headers={"api-key": QDRANT_API_KEY}, stream=True) as r:
        r.raise_for_status()
        with open(snapshot_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    immutable_shard = None
    if data_dir.exists():
        shutil.rmtree(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    EdgeShard.unpack_snapshot(str(snapshot_path), str(data_dir))

immutable_shard = EdgeShard(IMMUTABLE_SHARD_DIR)
```

### 3. Implement a Dual-Write Mechanism

With both Edge Shards initialized, you can implement a dual-write mechanism in your application as outlined in [Update a Server Collection from an Edge Shard](#update-a-server-collection-from-an-edge-shard). When adding or updating a point, write it to the mutable Edge Shard and enqueue it for writing to the server collection.

```python
from qdrant_edge import ( Point, UpdateOperation )
from qdrant_client import models
import time

SYNC_TIMESTAMP_KEY="timestamp"

id=2
vector=[0.4, 0.3, 0.2, 0.1]
payload={
    "color": "green",
    SYNC_TIMESTAMP_KEY: time.time()
}

point = Point(
    id=id,
    vector={VECTOR_NAME: vector},
    payload=payload
)

mutable_shard.update(UpdateOperation.upsert_points([point]))

rest_point = models.PointStruct(id=id, vector={VECTOR_NAME: vector}, payload=payload)

upload_queue.put(rest_point)
```

Each point's payload should include a timestamp field (`SYNC_TIMESTAMP_KEY` in this example) that records when the point was upserted. This timestamp is used to deduplicate data when the immutable Edge Shard is synchronized with the server.

### 4. Periodically Update the Immutable Edge Shard

You can periodically update the immutable Edge Shard with changes from the server using partial snapshots, as described in [Update Qdrant Edge with Server-Side Changes](#update-qdrant-edge-with-server-side-changes).

While restoring a snapshot, you may want to pause and buffer any ongoing data updates on the mutable Edge Shard. Before taking the snapshot, ensure all queued data has been written to the server. After the restoration is complete, you can resume normal operations. Refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo) for an example implementation.

```python
import time

manifest = immutable_shard.snapshot_manifest()

url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot/partial/create"

sync_timestamp = time.time()

with tempfile.TemporaryDirectory(dir=data_dir) as temp_dir:
    partial_snapshot_path = Path(temp_dir) / "partial.snapshot"
    response = requests.post(url, headers={"api-key": QDRANT_API_KEY}, json=manifest, stream=True)
    response.raise_for_status()
    
    with open(partial_snapshot_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    immutable_shard.update_from_snapshot(str(partial_snapshot_path))
```

This example records a `sync_timestamp` at the time of creating the partial snapshot. All points that were added to the mutable Edge Shard before this timestamp are now restored to the immutable Edge Shard. These duplicate points can now be deleted from the mutable Edge Shard:

```python
from qdrant_edge import (
    Filter,
    FieldCondition,
    RangeFloat
)

mutable_shard.update(
    UpdateOperation.delete_points_by_filter(Filter(
        must=[
            FieldCondition(
                key=SYNC_TIMESTAMP_KEY, range=RangeFloat(lte=sync_timestamp)
            )
        ])
)
```

### 5. Query Both Edge Shards

To provide a unified search experience across all data, query both the mutable and immutable Edge Shards and merge the two result sets. Since a point may exist in both Edge Shards, deduplicate the results based on point ID.

```python
from qdrant_edge import Query, QueryRequest

query_request = QueryRequest(
    query=Query.Nearest([0.2, 0.1, 0.9, 0.7], using=VECTOR_NAME),
    limit=10,
    with_vector=False,
    with_payload=True
)

mutable_results = mutable_shard.query(query_request)
immutable_results = immutable_shard.query(query_request)

all_results = list(mutable_results) + list(immutable_results)
all_results.sort(key=lambda x: x.score, reverse=True)

seen_ids = set()
unique_results = []
for result in all_results:
    if result.id not in seen_ids:
        seen_ids.add(result.id)
        unique_results.append(result)

results= [
    {
        "id": result.id,
        "score": result.score,
        "payload": result.payload
    }
    for result in unique_results[:10]
]
```

## Support

For explicit support in implementing Qdrant Edge in your project, please contact [Qdrant Sales](https://qdrant.tech/contact-us/).

