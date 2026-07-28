```java
static final String MAIN = "docs-sync-scale";
static final String MODEL = "sentence-transformers/all-MiniLM-L6-v2";

static void createCollection() throws Exception {
    if (!client.collectionExistsAsync(MAIN).get()) {
        client.createCollectionAsync(
            CreateCollection.newBuilder()
                .setCollectionName(MAIN)
                .setVectorsConfig(
                    VectorsConfig.newBuilder()
                        .setParams(
                            VectorParams.newBuilder()
                                .setSize(384)
                                .setDistance(Distance.Cosine)
                                .build())
                        .build())
                .putAllMetadata(
                    Map.of(
                        "embedding_model", value(MODEL),
                        "pipeline_version", value("1")))
                .build()).get();

        client.createPayloadIndexAsync(
            MAIN, "sync_bucket", PayloadSchemaType.Integer, null, null, null, null).get();
    }
}
```
