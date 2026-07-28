```python
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
```
