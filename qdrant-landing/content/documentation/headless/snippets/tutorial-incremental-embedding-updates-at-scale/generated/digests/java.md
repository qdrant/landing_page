```java
static long chunkDigest(String pid, String chash) throws Exception {
    // First 15 hex digits of the combined hash = a 60-bit number.
    // 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
    String combined = sha256Hex(pid + chash);
    return new BigInteger(combined.substring(0, 15), 16).longValue();
}

static long[] computeDigests(List<Chunk> chunks) throws Exception {
    long[] digests = new long[N_BUCKETS];
    for (Chunk c : chunks) {
        int b = bucket(c.pointId);
        digests[b] ^= chunkDigest(c.pointId, c.contentHash);
    }
    return digests;
}
```
