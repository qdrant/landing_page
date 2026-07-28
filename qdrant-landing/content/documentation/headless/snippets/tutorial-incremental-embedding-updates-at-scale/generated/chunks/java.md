```java
static class Chunk {
    String url;
    String anchor;
    int chunkNum;
    String text;
    String sectionUrl;  // derived in prepare
    String contentHash; // derived in prepare
    String pointId;     // derived in prepare

    Chunk(String url, String anchor, int chunkNum, String text) {
        this.url = url;
        this.anchor = anchor;
        this.chunkNum = chunkNum;
        this.text = text;
    }
}

static final List<Chunk> CHUNKS = List.of(
    new Chunk(
        "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
        "prerequisites",
        0,
        "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..."),
    new Chunk(
        "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
        "step-2-enable-tls",
        0,
        "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ..."),
    new Chunk(
        "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
        "step-3-enable-an-admin-api-key",
        0,
        "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ..."));
```
