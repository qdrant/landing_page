```java
static List<Integer> changedBuckets() throws Exception {
    List<Chunk> latest = prepare(LATEST);
    long[] source = computeDigests(latest); // digests of the edited source
    long[] stored = readMeta();             // digests Qdrant currently holds

    List<Integer> changed = new ArrayList<>();
    for (int b = 0; b < N_BUCKETS; b++) {
        if (source[b] != stored[b]) {
            changed.add(b);
        }
    }
    return changed;
}
```
