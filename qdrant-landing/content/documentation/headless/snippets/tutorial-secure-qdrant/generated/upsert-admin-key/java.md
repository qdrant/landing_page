```java
client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("my-admin-key")
        .build());

client.createCollectionAsync("my_collection",
    VectorParams.newBuilder()
        .setSize(4)
        .setDistance(Distance.Cosine)
        .build()).get();

client.upsertAsync("my_collection", List.of(
    PointStruct.newBuilder()
        .setId(id(1))
        .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
        .build()
)).get();
```
