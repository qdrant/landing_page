---
title: "Synchronize with a Server" 
weight: 30
---

# Synchronize Qdrant Edge with a Server

Qdrant Edge can be synchronized with a collection from an external Qdrant server to support use cases like:

- **Offload indexing**: Indexing is a computationally expensive operation. By synchronizing an Edge Shard with a server collection, you can offload the indexing process to a more powerful server instance. The indexed data can then be synchronized back to the Edge Shard.
- **Back up and Restore**: Regularly back up your Edge Shard data to a central Qdrant instance to prevent data loss. In case of hardware failure or data corruption on the edge device, you can restore the data from the central instance.
- **Data Aggregation**: Collect data from multiple Edge Shards deployed in different locations and aggregate it into a central Qdrant instance for comprehensive analysis and reporting.
- **Synchronization between devices**: Keep data consistent across multiple edge devices by synchronizing their Edge Shards with a central Qdrant instance.

For an example implementation of the patterns described in this guide, refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo).

## Synchronizing Qdrant Edge with a Server

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

