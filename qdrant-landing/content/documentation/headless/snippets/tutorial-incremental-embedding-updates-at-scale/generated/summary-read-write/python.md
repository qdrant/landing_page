```python
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
```
