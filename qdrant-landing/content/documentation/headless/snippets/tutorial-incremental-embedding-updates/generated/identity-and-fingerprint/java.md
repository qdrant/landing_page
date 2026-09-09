```java
static String contentHash(String text) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256")
        .digest(text.getBytes(StandardCharsets.UTF_8));
    return String.format("%064x", new BigInteger(1, digest));
}

static String pointId(String url, String anchor, int num) {
    // name-based UUID (version 3); the same address always yields the same ID
    return UUID.nameUUIDFromBytes(
        (url + "#" + anchor + "::" + num).getBytes(StandardCharsets.UTF_8)).toString();
}

// Derive both values (and the section address) for every raw chunk.
static List<Chunk> prepareChunksForSync(List<Chunk> chunks) throws Exception {
    List<Chunk> out = new ArrayList<>();
    for (Chunk c : chunks) {
        String text = normalize(c.text);
        Chunk prepared = new Chunk(c.url, c.anchor, c.chunkNum, text);
        prepared.sectionUrl = !c.anchor.isEmpty() ? c.url + "#" + c.anchor : c.url;
        prepared.contentHash = contentHash(text);
        prepared.pointId = pointId(c.url, c.anchor, c.chunkNum);
        out.add(prepared);
    }
    return out;
}
```
