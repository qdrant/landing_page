```python
latest = prepare(LATEST)
source = compute_digests(latest)   # digests of the edited source
stored = read_meta()               # digests Qdrant currently holds

changed_buckets = []
for b in range(N_BUCKETS):
    if source[b] != stored[b]:
        changed_buckets.append(b)

changed_buckets
```
