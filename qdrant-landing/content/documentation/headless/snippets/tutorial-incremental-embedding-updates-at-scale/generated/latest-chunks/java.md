```java
static final List<Chunk> LATEST = List.of(
    // unchanged
    new Chunk(
        "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
        "prerequisites",
        0,
        "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..."),
    // edited text
    new Chunk(
        "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
        "step-2-enable-tls",
        0,
        "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ..."),
    // step-3 removed; new step-4 added
    new Chunk(
        "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
        "step-4-restrict-access",
        0,
        "Step 4: Restrict access with read-only API keys for untrusted clients ..."));
```
