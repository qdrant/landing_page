```java
client
    .createVectorNameAsync(
        CreateVectorNameRequest.newBuilder()
            .setCollectionName(COLLECTION)
            .setVectorName(NEW_VECTOR)
            .setDenseConfig(
                DenseVectorCreationConfig.newBuilder()
                    .setSize(512) // Size of the new embedding vectors
                    .setDistance(Distance.Cosine) // Similarity function for the new model
                    .build())
            .build())
    .get();
```
