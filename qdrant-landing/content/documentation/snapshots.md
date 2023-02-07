---
title: Snapshots
weight: 51
---

*Available since v0.8.4*

Snapshots are performed on a per collection basis and consist in a `tar` archive file containing the necessary data to restore the collection at the time of the snapshot.

This feature can be used to archive data or easily replicate an existing deployment.

The target directory used to store generated snapshots is controlled through the [configuration](../configuration) or using the ENV variable: `QDRANT__STORAGE__SNAPSHOT_PATH=./snapshots`.

```yaml
storage:
  # Where to store snapshots
  snapshots_path: ./snapshots
```

It defaults to `./snapshots` if no value is provided.

## Create snapshot

To create a new snapshot for an existing collection:

```http
POST /collections/{collection_name}/snapshots
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.create_snapshot(
    collection_name="{collection_name}"
)
```

This is a synchronous operation for which a `tar` archive file will be generated into the `snapshot_path`.

### Delete snapshot

*Available since v1.0.0*

```http
DELETE /collections/{collection_name}/snapshots/{snapshot_name}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.delete_snapshot(
  collection_name="{collection_name}",
  snapshot_name="{snapshot_name}"
)
```

## List snapshot

List of snapshots for a collection:

```http
GET /collections/{collection_name}/snapshots
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.list_snapshots(
    collection_name="{collection_name}"
)
```

## Retrieve snapshot

To download a specified snapshot from a collection as a file:

```http
GET /collections/{collection_name}/snapshots/{snapshot_name}
```

Only available through the REST API for the time being.

## Restore snapshot

There is a difference in recovering snapshots in single-deployment node and distributed deployment mode.

### Recover in single deployment mode

Single deployment is simpler, you can recover any collection on the start-up and it will be immediately available in the service.
Restoring snapshots is done through the Qdrant CLI at startup time.

The main entry point is the `--snapshot` argument which accepts a list of pairs `<snapshot_file_path>:<target_collection_name>`

For example:

```bash
./qdrant --snapshot /snapshots/test-collection-archive.snapshot:test-collection --snapshot /snapshots/test-collection-archive.snapshot:test-copy-collection 
```

The target collection **must** be absent otherwise the program will exit with an error.

If you wish instead to overwrite an existing collection, use the `--force_snapshot` flag with caution.

### Recover in cluster deployment

*Available since v0.11.3*

Recovering in cluster mode is more sophisticated, as Qdrant should maintain consistency across peers even during the recovery process.
As the information about created collections is stored in the consensus, even a newly attached cluster node will automatically create collections.
Recovering non-existing collections with snapshots won't make this collection known to the consensus.

To recover snpshot in this case one can use snapshot recovery API:

```http
PUT /collections/<collection_name>/snapshots/recover

{
  "location": "http://qdrant-node-1:6333/collections/collection_name/snapshots/snapshot-2022-10-10.shapshot"
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="qdrant-node-2", port=6333)

client.recover_snapshot("collection_name", "http://qdrant-node-1:6333/collections/collection_name/snapshots/snapshot-2022-10-10.shapshot")
```

Qdrant will extract shard data from the snapshot and properly register shards in the cluster.
If there are other active replicas of the recovered shards in the cluster, Qdrant will replicate them to the newly recovered node to maintain data consistency.

## Snapshots for the whole storage

*Available since v0.8.5*

Sometimes it might be handy to create snapshot not just for a single collection, but for the whole storage, including collection aliases.
Qdrant provides a dedicated API for that as well. It is similar to collection-level snapshots, but does not require `collecton_name`:

### Create full storage snapshot

```http
POST /snapshots
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.create_full_snapshot()
```

### Delete full storage snapshot

*Available since v1.0.0*

```http
DELETE /snapshots/{snapshot_name}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.delete_full_snapshot(
  snapshot_name="{snapshot_name}"
)
```

### List full storage snapshots

```http
GET /snapshots
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.list_full_snapshots()
```

### Download full storage snapshot

```http
GET /snapshots/{snapshot_name}
```

## Restore full storage snapshot

Restoring snapshots is done through the Qdrant CLI at startup time.

For example:

```bash
./qdrant --storage-snapshot /snapshots/full-snapshot-2022-07-18-11-20-51.snapshot 
```
