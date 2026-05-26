```java
client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true).build());

try {
    client.upsertAsync("my_collection", List.of(
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
            .build()
    )).get();
} catch (Exception e) {
    System.out.println(e.getMessage()); // UNAUTHENTICATED
}
```
