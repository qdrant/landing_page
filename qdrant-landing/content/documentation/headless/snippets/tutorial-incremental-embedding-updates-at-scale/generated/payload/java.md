```java
static Map<String, Value> payload(Chunk c) throws Exception {
    Map<String, Value> p = new HashMap<>();
    p.put("url", value(c.url));
    p.put("anchor", value(c.anchor));
    p.put("chunk_num", value(c.chunkNum));
    p.put("section_url", value(c.sectionUrl));
    p.put("text", value(c.text));
    p.put("content_hash", value(c.contentHash));
    p.put("sync_bucket", value(bucket(c.pointId)));
    return p;
}
```
