```python
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
```
