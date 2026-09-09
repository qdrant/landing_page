```python
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
```
