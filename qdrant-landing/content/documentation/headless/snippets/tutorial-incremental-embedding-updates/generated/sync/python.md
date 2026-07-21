```python
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
```
