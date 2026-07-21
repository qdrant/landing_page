```python
from qdrant_client import QdrantClient, models

# Replace url and api_key with your own from https://cloud.qdrant.io
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True
)

MODEL = "sentence-transformers/all-MiniLM-L6-v2"
PIPELINE = "docs-prep-pipeline-v1"
COLLECTION = "docs-sync-tutorial"

client.create_collection(
    COLLECTION,
    vectors_config=models.VectorParams(
        size=384,  # all-MiniLM-L6-v2 output dimension
        distance=models.Distance.COSINE,
    ),
    metadata={"embedding_model": MODEL, "pipeline_version": PIPELINE},
)

def check_gate():
    # compare this pipeline's constants against what the collection records about itself
    meta = client.get_collection(COLLECTION).config.metadata or {}

    if meta.get("embedding_model") != MODEL or meta.get("pipeline_version") != PIPELINE:
        raise RuntimeError(f"collection was built by {meta}: full re-embed into a fresh collection required")

import hashlib
import uuid
from datetime import datetime, timezone

def content_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()

def point_id(url, anchor, num):
    # NAMESPACE_URL is a fixed constant uuid5 requires; it marks the input as a URL-like name
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{url}#{anchor}::{num}"))

def prepare_chunks_for_sync(chunks):
    """Derive both values (and the section address) for every raw chunk."""
    out = []
    for c in chunks:
        text = normalize(c["text"])
        out.append({
            **c,
            "text": text,
            "section_url": f"{c['url']}#{c['anchor']}" if c["anchor"] else c["url"],
            "content_hash": content_hash(text),
            "point_id": point_id(c["url"], c["anchor"], c["chunk_num"]),
        })
    return out

def payload(chunk, last_updated=None):
    return {
        "url": chunk["url"],
        "anchor": chunk["anchor"],
        "chunk_num": chunk["chunk_num"],
        "section_url": chunk["section_url"],
        "text": chunk["text"],
        "content_hash": chunk["content_hash"],
        "last_updated": last_updated or datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

for field in ("content_hash", "url", "section_url"):
    client.create_payload_index(COLLECTION, field, models.PayloadSchemaType.KEYWORD)

client.upsert(COLLECTION, points=[
    models.PointStruct(
        id=c["point_id"],
        vector=models.Document(text=c["text"], model=MODEL),
        payload=payload(c),
    )
    for c in prepare_chunks_for_sync(CHUNKS)
], wait=True)

QUERY = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?"

client.query_points(
    COLLECTION,
    query=models.Document(text=QUERY, model=MODEL),
    limit=3,
    with_payload=["section_url", "text"],
)

def split_by_state(latest_chunks):
    """Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown."""
    incoming = {c["point_id"]: c for c in latest_chunks}

    stored = {}
    points = client.retrieve(
        COLLECTION,
        ids=list(incoming),
        with_payload=["content_hash"],
        with_vectors=False,
    )
    for p in points:
        stored[str(p.id)] = p.payload["content_hash"]

    unchanged, content_changed, unknown_ids = [], [], []
    for pid, c in incoming.items():
        if stored.get(pid) == c["content_hash"]:
            unchanged.append(c)
        elif pid in stored:
            content_changed.append(c)
        else:
            unknown_ids.append(c)

    return incoming, unchanged, content_changed, unknown_ids

incoming_ids, unchanged, content_changed, unknown_ids = split_by_state(LATEST_CHUNKS)

def re_embed_changed(content_changed):
    if not content_changed:
        return
    client.upsert(COLLECTION,
        points=[
            models.PointStruct(
                id=c["point_id"],
                vector=models.Document(text=c["text"], model=MODEL),
                payload=payload(c),
            )
            for c in content_changed],
        wait=True)

def reuse_or_add(unknown_ids):
    """Reuse an existing embedding when the same text is already stored; embed only what is new."""
    reused, added = 0, 0

    for c in unknown_ids:
        same_text = models.Filter(must=[
            models.FieldCondition(
                key="content_hash",
                match=models.MatchValue(value=c["content_hash"]),
            )
        ])
        hits, _ = client.scroll(
            COLLECTION,
            scroll_filter=same_text,
            limit=1,
            with_payload=["last_updated"],
            with_vectors=True,
        )

        if hits:  # same text, new address: copy the vector, keep its last_updated
            point = models.PointStruct(
                id=c["point_id"],
                vector=hits[0].vector,
                payload=payload(c, hits[0].payload["last_updated"]),
            )
            reused += 1
        else:     # genuinely new content: embed and insert
            point = models.PointStruct(
                id=c["point_id"],
                vector=models.Document(text=c["text"], model=MODEL),
                payload=payload(c),
            )
            added += 1

        client.upsert(COLLECTION, points=[point], wait=True)

    return reused, added

def delete_gone(incoming_ids):
    """Remove every point the current crawl no longer contains. Returns how many."""
    if not incoming_ids:
        raise ValueError("Refusing to delete from an empty source snapshot.")

    stale = models.Filter(must_not=[models.HasIdCondition(has_id=list(incoming_ids))])

    to_delete = client.count(COLLECTION, count_filter=stale).count

    # potential check against a threshold to avoid accidental mass deletion could be added here
    client.delete(COLLECTION, points_selector=models.FilterSelector(filter=stale), wait=True)
    return to_delete

def sync(latest_chunks):
    check_gate()  # refuse to mix embedding models or pipeline versions

    chunks = prepare_chunks_for_sync(latest_chunks)
    incoming_ids, unchanged, content_changed, unknown_ids = split_by_state(chunks)

    re_embed_changed(content_changed)
    reused, added = reuse_or_add(unknown_ids)
    deleted = delete_gone(incoming_ids)

    return {
        "unchanged": len(unchanged),
        "re-embedded": len(content_changed),
        "reused_embedding": reused,
        "added": added,
        "deleted": deleted,
    }

run = sync(LATEST_CHUNKS)
print(run)
```
