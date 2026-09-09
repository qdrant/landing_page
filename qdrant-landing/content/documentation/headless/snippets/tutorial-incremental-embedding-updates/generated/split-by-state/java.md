```java
static class SyncState {
    Map<String, Chunk> incoming = new LinkedHashMap<>();
    List<Chunk> unchanged = new ArrayList<>();
    List<Chunk> contentChanged = new ArrayList<>();
    List<Chunk> unknownIds = new ArrayList<>();
}

// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
static SyncState splitByState(List<Chunk> latestChunks) throws Exception {
    SyncState state = new SyncState();
    for (Chunk c : latestChunks) {
        state.incoming.put(c.pointId, c);
    }

    Map<String, String> stored = new HashMap<>();
    var points = client.retrieveAsync(
        COLLECTION,
        state.incoming.keySet().stream()
            .map(pid -> id(UUID.fromString(pid)))
            .collect(Collectors.toList()),
        WithPayloadSelectorFactory.include(List.of("content_hash")),
        WithVectorsSelectorFactory.enable(false),
        null).get();
    for (var p : points) {
        stored.put(p.getId().getUuid(), p.getPayloadMap().get("content_hash").getStringValue());
    }

    for (Map.Entry<String, Chunk> e : state.incoming.entrySet()) {
        String pid = e.getKey();
        Chunk c = e.getValue();
        if (c.contentHash.equals(stored.get(pid))) {
            state.unchanged.add(c);
        } else if (stored.containsKey(pid)) {
            state.contentChanged.add(c);
        } else {
            state.unknownIds.add(c);
        }
    }

    return state;
}
```
