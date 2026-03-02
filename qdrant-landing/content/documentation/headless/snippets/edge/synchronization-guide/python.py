# @hide-start
# mypy: disable-error-code="import-untyped"
from queue import Queue
from qdrant_client import models
QDRANT_URL=""
QDRANT_API_KEY=""
upload_queue: Queue[models.PointStruct] = Queue()
# @hide-end

# @block-start initialize-mutable-shard
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
# @block-end initialize-mutable-shard

# @block-start initialize-immutable-shard
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
# @block-end initialize-immutable-shard

# @block-start dual-write
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
# @block-end dual-write

# @block-start update-immutable-shard
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
# @block-end update-immutable-shard

# @block-start delete-synced-points
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
)
# @block-end delete-synced-points

# @block-start query-both-shards
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
# @block-end query-both-shards
