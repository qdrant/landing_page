```python
COLLECTION_NAME="edge-collection"

snapshot_url = f"{QDRANT_URL}/collections/{COLLECTION_NAME}/shards/0/snapshot"

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

from pathlib import Path
from qdrant_edge import (
    Distance,
    EdgeConfig,
    EdgeVectorParams,
)

SHARD_DIRECTORY = "./qdrant-edge-directory"
VECTOR_NAME="my-vector"
VECTOR_DIMENSION=4

Path(SHARD_DIRECTORY).mkdir(parents=True, exist_ok=True)
config = EdgeConfig(
    vectors={
        VECTOR_NAME: EdgeVectorParams(
            size=VECTOR_DIMENSION,
            distance=Distance.Cosine,
        )
    }
)

edge_shard = EdgeShard(SHARD_DIRECTORY, config)

from qdrant_client import QdrantClient, models

server_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

COLLECTION_NAME="edge-collection"

if not server_client.collection_exists(collection_name=COLLECTION_NAME):

    server_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={VECTOR_NAME: models.VectorParams(size=VECTOR_DIMENSION, distance=models.Distance.COSINE)}
    )

from queue import Empty, Queue

# This is in-memory queue
# For production use cases consider persisting changes
upload_queue: Queue[models.PointStruct] = Queue()

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

BATCH_SIZE = 10
points_to_upload: list[models.PointStruct] = []

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
