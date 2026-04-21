```java
client.upsertAsync(
    UpsertPoints.newBuilder()
        .setCollectionName(collectionName)
        .addAllPoints(List.of(
            PointStruct.newBuilder()
                .setId(id(UUID.randomUUID()))
                .setVectors(namedVectors(Map.of(
                    "dense_vector",
                    vector(Document.newBuilder()
                        .setText("The best way to start a Wednesday is with a cup of coffee")
                        .setModel(denseModel)
                        .build()))))
                .putAllPayload(Map.of(
                    "text", value("The best way to start a Wednesday is with a cup of coffee"),
                    "datetime", value("2026-04-08T07:57:47")))
                .build()))
        .setShardKeySelector(shardKeySelector(today))
        .build()
).get();
```
