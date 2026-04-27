```java
String collectionName = "hybrid-search";

if (client.collectionExistsAsync(collectionName).get()) {
    client.deleteCollectionAsync(collectionName).get();
}

client.createCollectionAsync(
    CreateCollection.newBuilder()
        .setCollectionName(collectionName)
        .setVectorsConfig(
            VectorsConfig.newBuilder()
                .setParamsMap(
                    VectorParamsMap.newBuilder()
                        .putMap(
                            "dense",
                            VectorParams.newBuilder()
                                .setSize(384)
                                .setDistance(Distance.Cosine)
                                .build())
                        .putMap(
                            "multi",
                            VectorParams.newBuilder()
                                .setSize(96)
                                .setDistance(Distance.Cosine)
                                .setMultivectorConfig(
                                    MultiVectorConfig.newBuilder()
                                        .setComparator(MultiVectorComparator.MaxSim)
                                        .build())
                                .setHnswConfig(
                                    HnswConfigDiff.newBuilder()
                                        .setM(0) // Disable HNSW for reranking
                                        .build())
                                .build())
                        .build()))
        .setSparseVectorsConfig(
            SparseVectorConfig.newBuilder()
                .putMap(
                    "sparse",
                    SparseVectorParams.newBuilder()
                        .setModifier(Modifier.Idf)
                        .build())
                .build())
        .build()
).get();
```
