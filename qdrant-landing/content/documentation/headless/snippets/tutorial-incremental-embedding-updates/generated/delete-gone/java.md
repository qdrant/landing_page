```java
// Remove every point the current crawl no longer contains. Returns how many.
static long deleteGone(Map<String, Chunk> incomingIds) throws Exception {
    if (incomingIds.isEmpty()) {
        throw new IllegalArgumentException("Refusing to delete from an empty source snapshot.");
    }

    Filter stale = Filter.newBuilder()
        .addMustNot(hasId(
            incomingIds.keySet().stream()
                .map(pid -> id(UUID.fromString(pid)))
                .collect(Collectors.toList())))
        .build();

    long toDelete = client.countAsync(COLLECTION, stale, true).get();

    // potential check against a threshold to avoid accidental mass deletion could be added here
    client.deleteAsync(COLLECTION, stale).get();
    return toDelete;
}
```
