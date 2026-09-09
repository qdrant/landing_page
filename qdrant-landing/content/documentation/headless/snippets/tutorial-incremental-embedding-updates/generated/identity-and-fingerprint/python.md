```python
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
```
