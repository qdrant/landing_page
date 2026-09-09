```java
static Map<String, Long> sync(List<Chunk> latestChunks) throws Exception {
    checkGate(); // refuse to mix embedding models or pipeline versions

    List<Chunk> chunks = prepareChunksForSync(latestChunks);
    SyncState state = splitByState(chunks);

    reEmbedChanged(state.contentChanged);
    int[] reusedAdded = reuseOrAdd(state.unknownIds); // {reused, added}
    long deleted = deleteGone(state.incoming);

    return Map.of(
        "unchanged", (long) state.unchanged.size(),
        "re-embedded", (long) state.contentChanged.size(),
        "reused_embedding", (long) reusedAdded[0],
        "added", (long) reusedAdded[1],
        "deleted", deleted);
}
```
