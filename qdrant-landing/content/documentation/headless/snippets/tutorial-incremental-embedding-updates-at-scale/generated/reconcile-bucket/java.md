```java
// Make bucket b in Qdrant match sourceChunks. Returns {added, reEmbedded, deleted}.
static int[] reconcileBucket(int b, Map<String, Chunk> sourceChunks) throws Exception {
    Map<String, String> stored = readBucket(b); // point ID -> content hash currently in Qdrant

    List<Chunk> toWrite = new ArrayList<>();    // new or content-changed chunks: embed and upsert
    int added = 0;
    int reEmbedded = 0;
    for (Map.Entry<String, Chunk> e : sourceChunks.entrySet()) {
        String storedHash = stored.get(e.getKey());
        if (storedHash == null) {
            toWrite.add(e.getValue());          // new chunk in this bucket
            added++;
        } else if (!storedHash.equals(e.getValue().contentHash)) {
            toWrite.add(e.getValue());          // same chunk, changed text
            reEmbedded++;
        }
    }

    List<PointId> toDelete = new ArrayList<>(); // chunks Qdrant has but the source no longer does
    for (String pid : stored.keySet()) {
        if (!sourceChunks.containsKey(pid)) {
            toDelete.add(id(UUID.fromString(pid)));
        }
    }

    if (!toWrite.isEmpty()) {
        client.upsertAsync(MAIN, asPoints(toWrite)).get();
    }
    if (!toDelete.isEmpty()) {
        client.deleteAsync(MAIN, toDelete).get();
    }

    return new int[] {added, reEmbedded, toDelete.size()};
}
```
