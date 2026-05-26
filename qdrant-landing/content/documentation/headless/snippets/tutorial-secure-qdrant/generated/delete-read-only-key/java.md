```java
client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("my-read-only-key")
        .build());

try {
    client.deleteAsync("my_collection", List.of(id(1))).get();
} catch (Exception e) {
    System.out.println(e.getMessage()); // PERMISSION_DENIED
}
```
