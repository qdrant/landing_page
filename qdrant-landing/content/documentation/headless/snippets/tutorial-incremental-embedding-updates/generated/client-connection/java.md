```java
// Replace the host and API key with your own from https://cloud.qdrant.io
static final QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
            .withApiKey("<your-api-key>")
            .build());
```
