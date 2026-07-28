```python
def sync(latest_chunks):
    latest = prepare(latest_chunks)

    # group the source chunks by bucket once
    source_by_bucket = {}
    for c in latest:
        b = bucket(c["point_id"])
        source_by_bucket.setdefault(b, {})[c["point_id"]] = c

    # steps 1-3: which buckets changed
    source = compute_digests(latest)
    stored = read_meta()
    changed_buckets = []
    for b in range(N_BUCKETS):
        if source[b] != stored[b]:
            changed_buckets.append(b)

    # step 4: reconcile each changed bucket
    report = {"changed_buckets": changed_buckets, "added": 0, "re_embedded": 0, "deleted": 0}
    for b in changed_buckets:
        source_chunks = source_by_bucket.get(b, {})
        added, re_embedded, deleted = reconcile_bucket(b, source_chunks)
        report["added"] += added
        report["re_embedded"] += re_embedded
        report["deleted"] += deleted

    # step 5: rewrite only the changed groups of the summary, after the data writes
    changed_groups = set()
    for b in changed_buckets:
        changed_groups.add(b // GROUP_SIZE)
    write_meta(source, changed_groups)

    return report
```
