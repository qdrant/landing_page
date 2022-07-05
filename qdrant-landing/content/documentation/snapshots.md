---
title: Snapshots
weight: 51
---

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
from qdrant_client.http import models

client = QdrantClient(host="localhost", port=6333)

client.create_snapshot(
    collection_name="{collection_name}"
)
```

This is a synchronous operation for which a `tar` archive file will be generated into the `snapshot_path`.

## List snapshot

List of snapshots for a collection:

```http
GET /collections/{collection_name}/snapshots
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

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

Restoring snapshots is done through the Qdrant CLI at startup time.

The main entry point is the `--snapshot` argument which accepts a list of pairs `<snapshot_file_path>:<target_collection_name>`

For example:

```bash
./qdrant --snapshot /snapshots/test-collection-archive.tar:test-collection /snapshots/test-collection-archive.tar:test-copy-collection 
```

The target collection **must** be absent otherwise the program will exit with an error.

If you wish instead to overwrite an existing collection, use the `--force_snapshot` flag with caution.
