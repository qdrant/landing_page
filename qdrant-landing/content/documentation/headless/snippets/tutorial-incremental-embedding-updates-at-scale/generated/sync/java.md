```java
static Map<String, Object> sync(List<Chunk> latestChunks) throws Exception {
    List<Chunk> latest = prepare(latestChunks);

    // group the source chunks by bucket once
    Map<Integer, Map<String, Chunk>> sourceByBucket = new LinkedHashMap<>();
    for (Chunk c : latest) {
        sourceByBucket
            .computeIfAbsent(bucket(c.pointId), key -> new LinkedHashMap<>())
            .put(c.pointId, c);
    }

    // steps 1-3: which buckets changed
    long[] source = computeDigests(latest);
    long[] stored = readMeta();
    List<Integer> changed = new ArrayList<>();
    for (int b = 0; b < N_BUCKETS; b++) {
        if (source[b] != stored[b]) {
            changed.add(b);
        }
    }

    // step 4: reconcile each changed bucket
    int added = 0;
    int reEmbedded = 0;
    int deleted = 0;
    for (int b : changed) {
        int[] counts = reconcileBucket(b, sourceByBucket.getOrDefault(b, Map.of()));
        added += counts[0];
        reEmbedded += counts[1];
        deleted += counts[2];
    }

    // step 5: rewrite only the changed groups of the summary, after the data writes
    Set<Integer> changedGroups = new LinkedHashSet<>();
    for (int b : changed) {
        changedGroups.add(b / GROUP_SIZE);
    }
    writeMeta(source, changedGroups);

    return Map.of(
        "changed_buckets", changed,
        "added", added,
        "re_embedded", reEmbedded,
        "deleted", deleted);
}
```
