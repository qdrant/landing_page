# @block-start client-connection
import os

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    cloud_inference=True,
)
# @block-end client-connection

# @block-start chunks
CHUNKS = [
    {"url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
     "anchor": "prerequisites", "chunk_num": 0,
     "text": "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..."},
    {"url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
     "anchor": "step-2-enable-tls", "chunk_num": 0,
     "text": "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ..."},
    {"url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
     "anchor": "step-3-enable-an-admin-api-key", "chunk_num": 0,
     "text": "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ..."},
]
# @block-end chunks

# @block-start identity-and-fingerprint
import hashlib
import uuid


def content_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()


def point_id(url, anchor, num):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{url}#{anchor}::{num}"))


def prepare(chunks):
    """Attach the derived values every later step depends on."""
    prepared = []
    for c in chunks:
        # Run c["text"] through your normalization pass before hashing it.
        section_url = f'{c["url"]}#{c["anchor"]}' if c["anchor"] else c["url"]
        prepared.append({
            **c,
            "section_url": section_url,
            "content_hash": content_hash(c["text"]),
            "point_id": point_id(c["url"], c["anchor"], c["chunk_num"]),
        })
    return prepared
# @block-end identity-and-fingerprint

# @block-start buckets
N_BUCKETS = 16   # use something much larger in production
GROUP_SIZE = 4   # bucket digests packed per summary point; 16 / 4 = 4 groups


def bucket(pid):
    return int(hashlib.sha256(pid.encode()).hexdigest(), 16) % N_BUCKETS


for c in prepare(CHUNKS):
    print(bucket(c["point_id"]), c["point_id"], c["section_url"])
# @block-end buckets

# @block-start digests
def chunk_digest(pid, chash):
    # First 15 hex digits of the combined hash = a 60-bit number.
    # 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
    combined = hashlib.sha256((pid + chash).encode()).hexdigest()
    return int(combined[:15], 16)


def compute_digests(chunks):
    digests = [0] * N_BUCKETS
    for c in chunks:
        b = bucket(c["point_id"])
        digests[b] ^= chunk_digest(c["point_id"], c["content_hash"])
    return digests


compute_digests(prepare(CHUNKS))
# @block-end digests

# @block-start create-collection
MAIN = "docs-sync-scale"
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

if not client.collection_exists(MAIN):
    client.create_collection(
        MAIN,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        metadata={"embedding_model": MODEL, "pipeline_version": "1"},
    )
    client.create_payload_index(MAIN, "sync_bucket", models.PayloadSchemaType.INTEGER)
# @block-end create-collection

# @block-start payload
def payload(c):
    return {
        "url": c["url"],
        "anchor": c["anchor"],
        "chunk_num": c["chunk_num"],
        "section_url": c["section_url"],
        "text": c["text"],
        "content_hash": c["content_hash"],
        "sync_bucket": bucket(c["point_id"]),
    }
# @block-end payload

# @block-start populate
def as_points(chunks):
    points = []
    for c in chunks:
        points.append(models.PointStruct(
            id=c["point_id"],
            vector=models.Document(text=c["text"], model=MODEL),  # embedded by Qdrant Cloud Inference
            payload=payload(c),
        ))
    return points


client.upsert(MAIN, points=as_points(prepare(CHUNKS)), wait=True)
# @block-end populate

# @block-start summary-collection
META = "docs-sync-digests"
N_META = N_BUCKETS // GROUP_SIZE

if not client.collection_exists(META):
    client.create_collection(
        META,
        vectors_config=models.VectorParams(size=1, distance=models.Distance.COSINE),
    )
# @block-end summary-collection

# @block-start summary-read-write
def write_meta(digests, groups=None):
    """Store bucket digests in the summary collection, one point per group.

    digests: the full list of N_BUCKETS digests.
    groups:  which group points to rewrite; defaults to all of them.
    """
    if groups is None:
        groups = range(N_META)

    points = []
    for g in groups:
        # group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
        start = g * GROUP_SIZE
        group_digests = digests[start:start + GROUP_SIZE]
        points.append(models.PointStruct(
            id=g,
            vector=[1.0],  # dummy: this collection is never searched
            payload={"group": g, "digests": group_digests},
        ))
    client.upsert(META, points=points, wait=True)


def read_meta():
    """Read the summary back as a flat list of N_BUCKETS digests."""
    digests = [0] * N_BUCKETS
    for point in client.retrieve(META, ids=list(range(N_META)), with_payload=True):
        g = point.payload["group"]
        for slot, digest in enumerate(point.payload["digests"]):
            digests[g * GROUP_SIZE + slot] = digest
    return digests


write_meta(compute_digests(prepare(CHUNKS)))
read_meta()
# @block-end summary-read-write

# @block-start latest-chunks
LATEST = [
    # unchanged
    {"url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
     "anchor": "prerequisites", "chunk_num": 0,
     "text": "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..."},
    # edited text
    {"url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
     "anchor": "step-2-enable-tls", "chunk_num": 0,
     "text": "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ..."},
    # step-3 removed; new step-4 added
    {"url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
     "anchor": "step-4-restrict-access", "chunk_num": 0,
     "text": "Step 4: Restrict access with read-only API keys for untrusted clients ..."},
]
# @block-end latest-chunks

# @block-start changed-buckets
latest = prepare(LATEST)
source = compute_digests(latest)   # digests of the edited source
stored = read_meta()               # digests Qdrant currently holds

changed_buckets = []
for b in range(N_BUCKETS):
    if source[b] != stored[b]:
        changed_buckets.append(b)

changed_buckets
# @block-end changed-buckets

# @block-start read-bucket
def read_bucket(b):
    """Return {point_id: content_hash} for every chunk stored in bucket b.

    Pages through the results so nothing is missed in a large bucket.
    """
    stored = {}
    offset = None
    while True:
        points, offset = client.scroll(
            MAIN,
            scroll_filter=models.Filter(
                must=[models.FieldCondition(
                    key="sync_bucket",
                    match=models.MatchValue(value=b),
                )],
            ),
            with_payload=["content_hash"],
            with_vectors=False,
            limit=1000,
            offset=offset,
        )
        for point in points:
            stored[str(point.id)] = point.payload["content_hash"]
        if offset is None:
            return stored
# @block-end read-bucket

# @block-start reconcile-bucket
def reconcile_bucket(b, source_chunks):
    """Make bucket b in Qdrant match source_chunks. Returns (added, re_embedded, deleted)."""
    stored = read_bucket(b)   # {point_id: content_hash} currently in Qdrant

    to_write = []             # new or content-changed chunks: embed and upsert
    added = 0
    re_embedded = 0
    for pid, chunk in source_chunks.items():
        if pid not in stored:
            to_write.append(chunk)        # new chunk in this bucket
            added += 1
        elif stored[pid] != chunk["content_hash"]:
            to_write.append(chunk)        # same chunk, changed text
            re_embedded += 1

    to_delete = []            # chunks Qdrant has but the source no longer does
    for pid in stored:
        if pid not in source_chunks:
            to_delete.append(pid)

    if to_write:
        client.upsert(MAIN, points=as_points(to_write), wait=True)
    if to_delete:
        client.delete(MAIN, points_selector=models.PointIdsList(points=to_delete), wait=True)

    return added, re_embedded, len(to_delete)
# @block-end reconcile-bucket

# @block-start sync
def sync(latest_chunks):
    latest = prepare(latest_chunks)

    # group the source chunks by bucket once
    source_by_bucket = {}
    for c in latest:
        b = bucket(c["point_id"])
        source_by_bucket.setdefault(b, {})[c["point_id"]] = c

    # steps 1-3: which buckets changed
    source = compute_digests(latest)
    stored = read_meta()
    changed_buckets = []
    for b in range(N_BUCKETS):
        if source[b] != stored[b]:
            changed_buckets.append(b)

    # step 4: reconcile each changed bucket
    report = {"changed_buckets": changed_buckets, "added": 0, "re_embedded": 0, "deleted": 0}
    for b in changed_buckets:
        source_chunks = source_by_bucket.get(b, {})
        added, re_embedded, deleted = reconcile_bucket(b, source_chunks)
        report["added"] += added
        report["re_embedded"] += re_embedded
        report["deleted"] += deleted

    # step 5: rewrite only the changed groups of the summary, after the data writes
    changed_groups = set()
    for b in changed_buckets:
        changed_groups.add(b // GROUP_SIZE)
    write_meta(source, changed_groups)

    return report
# @block-end sync

# @block-start run-sync
sync(LATEST)
# @block-end run-sync
