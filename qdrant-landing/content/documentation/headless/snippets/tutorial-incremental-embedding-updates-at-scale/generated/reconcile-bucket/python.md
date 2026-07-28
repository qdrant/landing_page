```python
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
```
