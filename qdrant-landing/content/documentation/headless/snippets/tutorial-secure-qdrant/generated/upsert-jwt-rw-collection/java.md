```java
client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("<your-jwt>")
        .build());

client.upsertAsync("my_collection", List.of(
    PointStruct.newBuilder()
        .setId(id(2))
        .setVectors(vectors(0.5f, 0.6f, 0.7f, 0.8f))
        .build()
)).get();
```
