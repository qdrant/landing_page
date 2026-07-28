```java
static final int N_BUCKETS = 16; // use something much larger in production
static final int GROUP_SIZE = 4; // bucket digests packed per summary point; 16 / 4 = 4 groups

static int bucket(String pid) throws Exception {
    // the whole 256-bit hash as one number, then modulo N_BUCKETS
    return new BigInteger(sha256Hex(pid), 16).mod(BigInteger.valueOf(N_BUCKETS)).intValue();
}

// The buckets printed in the tutorial come from the Python point IDs; this file derives its own.
static void printBuckets() throws Exception {
    for (Chunk c : prepare(CHUNKS)) {
        System.out.println(bucket(c.pointId) + " " + c.pointId + " " + c.sectionUrl);
    }
}
```
