```java
String today = "2026-04-08";
String oldestShardKey = LocalDate.parse(today).minusDays(7).toString();

client.createShardKeyAsync(
    CreateShardKeyRequest.newBuilder()
        .setCollectionName(collectionName)
        .setRequest(CreateShardKey.newBuilder()
            .setShardKey(shardKey(today))
            .build())
        .build()
).get();

client.deleteShardKeyAsync(
    DeleteShardKeyRequest.newBuilder()
        .setCollectionName(collectionName)
        .setRequest(DeleteShardKey.newBuilder()
            .setShardKey(shardKey(oldestShardKey))
            .build())
        .build()
).get();
```
