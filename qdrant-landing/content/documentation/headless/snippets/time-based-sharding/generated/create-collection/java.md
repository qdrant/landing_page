```java
String collectionName = "my_collection";

if (client.collectionExistsAsync(collectionName).get()) {
    client.deleteCollectionAsync(collectionName).get();
}

client.createCollectionAsync(
    CreateCollection.newBuilder()
        .setCollectionName(collectionName)
        .setVectorsConfig(VectorsConfig.newBuilder().setParamsMap(
            VectorParamsMap.newBuilder().putAllMap(Map.of(
                "dense_vector",
                VectorParams.newBuilder()
                    .setSize(384)
                    .setDistance(Distance.Cosine)
                    .build()))))
        .setShardingMethod(ShardingMethod.Custom)
        .build()
).get();
```
