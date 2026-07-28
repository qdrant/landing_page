```java
// The Java client takes a host and port rather than a URL, so only the API key is read
// from the environment. Replace the host with your own from https://cloud.qdrant.io
static final QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
            .withApiKey(System.getenv("QDRANT_API_KEY"))
            .build());
```
