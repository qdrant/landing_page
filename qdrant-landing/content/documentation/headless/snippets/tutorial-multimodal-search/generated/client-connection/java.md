```java
QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
            .withApiKey(QDRANT_API_KEY)
            .build());
```
