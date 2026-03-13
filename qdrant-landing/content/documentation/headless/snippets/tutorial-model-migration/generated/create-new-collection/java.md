```java
client.createCollectionAsync(NEW_COLLECTION,
        VectorParams.newBuilder()
            .setSize(512) // Size of the new embedding vectors
            .setDistance(Distance.Cosine) // Similarity function for the new model
            .build()).get();
```
