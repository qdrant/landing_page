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
        .build()
).get();

client.createPayloadIndexAsync(
    collectionName,
    "description",
    PayloadSchemaType.Text,
    PayloadIndexParams.newBuilder()
        .setTextIndexParams(
            TextIndexParams.newBuilder()
                .setTokenizer(TokenizerType.Word)
                .setStemmer(
                    StemmingAlgorithm.newBuilder()
                        .setSnowball(
                            SnowballParams.newBuilder().setLanguage("english").build())
                        .build())
                .setStopwords(StopwordsSet.newBuilder().addLanguages("english").build())
                // Enable BM25 scoring
                .setScoring(
                    TextScoringParams.newBuilder().setType(TextScoringType.Bm25).build())
                .build())
        .build(),
    null,
    null,
    null
).get();
```
