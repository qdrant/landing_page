```java
static final String QDRANT_URL = System.getenv("QDRANT_URL");
static final String QDRANT_API_KEY = System.getenv("QDRANT_API_KEY");

static final QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
            .withApiKey(QDRANT_API_KEY)
            .build());
```
