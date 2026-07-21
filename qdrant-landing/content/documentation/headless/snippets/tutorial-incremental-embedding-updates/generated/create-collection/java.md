```java
static final String MODEL = "sentence-transformers/all-MiniLM-L6-v2";
static final String PIPELINE = "docs-prep-pipeline-v1";
static final String COLLECTION = "docs-sync-tutorial";

static void createCollection() throws Exception {
    client.createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName(COLLECTION)
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(384) // all-MiniLM-L6-v2 output dimension
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .putAllMetadata(
                Map.of(
                    "embedding_model", value(MODEL),
                    "pipeline_version", value(PIPELINE)))
            .build()).get();
}
```
