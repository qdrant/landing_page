```java
static String sha256Hex(String text) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256")
        .digest(text.getBytes(StandardCharsets.UTF_8));
    return String.format("%064x", new BigInteger(1, digest));
}

static String contentHash(String text) throws Exception {
    return sha256Hex(text);
}

static String pointId(String url, String anchor, int num) {
    // The JDK has no UUIDv5, so this is a name-based UUID (version 3). It is just as stable
    // and deterministic, but it does not match the Python tab's uuid5 values, which means
    // every ID, bucket, and digest printed in this tutorial is Python's, not this file's.
    return UUID.nameUUIDFromBytes(
        (url + "#" + anchor + "::" + num).getBytes(StandardCharsets.UTF_8)).toString();
}

// Attach the derived values every later step depends on.
static List<Chunk> prepare(List<Chunk> chunks) throws Exception {
    List<Chunk> prepared = new ArrayList<>();
    for (Chunk c : chunks) {
        // Run c.text through your normalization pass before hashing it.
        Chunk out = new Chunk(c.url, c.anchor, c.chunkNum, c.text);
        out.sectionUrl = !c.anchor.isEmpty() ? c.url + "#" + c.anchor : c.url;
        out.contentHash = contentHash(c.text);
        out.pointId = pointId(c.url, c.anchor, c.chunkNum);
        prepared.add(out);
    }
    return prepared;
}
```
