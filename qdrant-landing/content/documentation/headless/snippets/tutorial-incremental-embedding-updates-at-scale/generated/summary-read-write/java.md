```java
// Store bucket digests in the summary collection, one point per group.
// digests: the full list of N_BUCKETS digests.
// groups:  which group points to rewrite; null rewrites all of them.
static void writeMeta(long[] digests, Set<Integer> groups) throws Exception {
    if (groups == null) {
        groups = new LinkedHashSet<>();
        for (int g = 0; g < N_META; g++) {
            groups.add(g);
        }
    }

    List<PointStruct> points = new ArrayList<>();
    for (int g : groups) {
        // group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
        int start = g * GROUP_SIZE;
        List<Value> groupDigests = new ArrayList<>();
        for (int slot = 0; slot < GROUP_SIZE; slot++) {
            groupDigests.add(value(digests[start + slot]));
        }
        points.add(
            PointStruct.newBuilder()
                .setId(id(g))
                .setVectors(vectors(1.0f)) // dummy: this collection is never searched
                .putPayload("group", value(g))
                .putPayload("digests", list(groupDigests))
                .build());
    }
    client.upsertAsync(META, points).get();
}

// Read the summary back as a flat list of N_BUCKETS digests.
static long[] readMeta() throws Exception {
    long[] digests = new long[N_BUCKETS];
    List<PointId> ids = new ArrayList<>();
    for (int g = 0; g < N_META; g++) {
        ids.add(id(g));
    }

    var points = client.retrieveAsync(
        META,
        ids,
        WithPayloadSelectorFactory.enable(true),
        WithVectorsSelectorFactory.enable(false),
        null).get();

    for (var point : points) {
        int g = (int) point.getPayloadMap().get("group").getIntegerValue();
        List<Value> groupDigests = point.getPayloadMap().get("digests").getListValue().getValuesList();
        for (int slot = 0; slot < groupDigests.size(); slot++) {
            digests[g * GROUP_SIZE + slot] = groupDigests.get(slot).getIntegerValue();
        }
    }
    return digests;
}
```
