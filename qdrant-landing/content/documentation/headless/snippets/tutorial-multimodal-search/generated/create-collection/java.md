```java
String collectionName = "multimodal-embeddings";

if (!client.collectionExistsAsync(collectionName).get()) {
    client.createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName(collectionName)
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParamsMap(
                        VectorParamsMap.newBuilder()
                            .putMap(
                                "image",
                                VectorParams.newBuilder()
                                    .setSize(512)
                                    .setDistance(Distance.Cosine)
                                    .build())
                            .putMap(
                                "text",
                                VectorParams.newBuilder()
                                    .setSize(512)
                                    .setDistance(Distance.Cosine)
                                    .build())
                            .build()))
            .build()
    ).get();
}
```
