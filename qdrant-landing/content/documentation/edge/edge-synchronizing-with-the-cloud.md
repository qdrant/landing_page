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

Note that the assumption here is that the Edge Shard corresponds to a single shard in the server-side collection. When creating a snapshot for synchronization, specify the applicable server-side shard ID in the snapshot URL (`0` in this example). This allows a single collection to serve multiple independent users or devices, each with its own Edge Shard. Read more about Qdrant's sharding strategy in the [Tiered Multitenancy Documentation](/documentation/guides/multitenancy/#tiered-multitenancy).

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

This code first downloads the snapshot to a temporary directory. Next, the current instance of `EdgeShard` (if it exists) is destroyed by setting it to `None` and deleting its data directory. Finally, `EdgeShard.unpack_snapshot` unpacks the downloaded snapshot into the data directory, and a new instance of `EdgeShard` is created using the unpacked snapshot's data and configuration.

While restoring a snapshot, you may want to pause and buffer any ongoing data updates on the Edge Shard. Before taking the snapshot, ensure all queued data has been written to the server. After the restoration is complete, you can resume normal operations. Refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo) for an example implementation.

The `edge_shard` will use same configuration and same file structure as the source collection from which the snapshot was created, including vector and payload indexes.

## Synchronize Server-Side Changes with Qdrant Edge

To synchronize Qdrant Edge with a server-side collection, you can periodically create snapshots on the server and apply them to Qdrant Edge. This scenario assumes you run two Edge Shards on the device:

- A **mutable** Edge Shard: This Edge Shard handles local updates and queries. It stores new points added on the device.
- An **immutable** Edge Shard: This Edge Shard contains data synchronized from the server. It is periodically updated from the server using a partial snapshot.

When querying data, merge results from both Edge Shards to provide a unified view. This way, new points added on the device are available for search alongside the data synchronized from the server.

### 1. Initialize a Mutable Edge Shard

The mutable Edge Shard will handle local data updates. It can be initialized from scratch, as shown in the [Qdrant Edge Quickstart Guide](/documentation/edge/edge-quickstart/).

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

Before initializing the immutable Edge Shard, set up a Qdrant client connection to the server and create the target collection if it does not exist. This collection will contain the same data as the immutable Edge Shard.

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

Now, you can create the immutable Edge Shard from a snapshot on the server, as described in [Initialize Edge Shard from existing Qdrant Collection](#initialize-edge-shard-from-existing-qdrant-collection):

```python
import requests
import tempfile
import shutil

snapshot_url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"

def download_snapshot(url: str, target_path: Path):
    with requests.get(url, headers={"api-key": QDRANT_API_KEY}, stream=True) as r:
        r.raise_for_status()
        with open(target_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

IMMUTABLE_SHARD_DIR = "./qdrant-edge-directory/immutable"

data_dir = Path(IMMUTABLE_SHARD_DIR)

with tempfile.TemporaryDirectory(dir=data_dir.parent) as restore_dir:
    snapshot_path = Path(restore_dir) / "shard.snapshot"

    download_snapshot(snapshot_url, snapshot_path)

    immutable_shard = None
    if data_dir.exists():
        shutil.rmtree(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    EdgeShard.unpack_snapshot(str(snapshot_path), str(data_dir))

immutable_shard = EdgeShard(str(data_dir))
```

Note that the assumption here is that the Edge Shard corresponds to a single shard in the server-side collection. When creating a snapshot for synchronization, specify the applicable server-side shard ID in the snapshot URL (`0` in this example). This allows a single collection to serve multiple independent users or devices, each with its own Edge Shard. Read more about Qdrant's sharding strategy in the [Tiered Multitenancy Documentation](/documentation/guides/multitenancy/#tiered-multitenancy).

### 3. Implement a Dual-Write Mechanism

With both Edge Shards initialized, you can implement a dual-write mechanism in your application. When adding or updating a point, write it to the mutable Edge Shard as well as the server collection.

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

server_client.upsert(
    collection_name=COLLECTION_NAME, points=[rest_point]
)
```

To each point's payload, add a timestamp field (`SYNC_TIMESTAMP_KEY` in this example) that records when the point was upserted. This timestamp is needed when the immutable Edge Shard is synchronized.

This simplified example writes to the server synchronously. In a production scenario, consider implementing an asynchronous mechanism using a queue, as described in [Update a Server Collection from an Edge Shard](#update-a-server-collection-from-an-edge-shard), especially if the edge device has intermittent connectivity.

### 4. Periodically Update the Immutable Edge Shard

Now you can periodically synchronize the immutable Edge Shard with the server by downloading and applying a snapshot. Restoring a full snapshot every time would create unnecessary overhead. Instead, you can use partial snapshots to only restore the changes since the last time a snapshot was restored. A partial snapshot contains only those segments that have changed, based on the immutable Edge Shard's manifest. A manifest describes all the segments in a shard and the shard's metadata.

If you've implementen an asynchronous dual-write mechanism, ensure that all queued updates have been sent to the server before creating the partial snapshot.

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

This example records a `sync_timestamp` at the time of creating the partial snapshot. All points in the mutable Edge Shard that were added before the `sync_timestamp` have now been restored to the immutable Edge Shard. To avoid duplicate points when querying both shards, remove these points from the mutable Edge Shard:

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

For a unified search experience across all the data, query both the mutable and immutable Edge Shards and merge their results. Because the queries may execute when a point exists in both shards, you need to deduplicate the results based on point ID.

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

## Support

For explicit support in implementing Qdrant Edge in your project, please contact [Qdrant Sales](https://qdrant.tech/contact-us/).

