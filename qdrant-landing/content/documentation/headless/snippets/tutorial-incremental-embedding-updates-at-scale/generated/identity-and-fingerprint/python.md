```python
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
```
