```java
static Map<String, Value> payload(Chunk chunk, String lastUpdated) {
    Map<String, Value> p = new HashMap<>();
    p.put("url", value(chunk.url));
    p.put("anchor", value(chunk.anchor));
    p.put("chunk_num", value(chunk.chunkNum));
    p.put("section_url", value(chunk.sectionUrl));
    p.put("text", value(chunk.text));
    p.put("content_hash", value(chunk.contentHash));
    p.put("last_updated", value(lastUpdated != null
        ? lastUpdated
        : OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS).toString()));
    return p;
}
```
