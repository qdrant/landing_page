```java
static final String META = "docs-sync-digests";
static final int N_META = N_BUCKETS / GROUP_SIZE;

static void createSummaryCollection() throws Exception {
    if (!client.collectionExistsAsync(META).get()) {
        client.createCollectionAsync(
            CreateCollection.newBuilder()
                .setCollectionName(META)
                .setVectorsConfig(
                    VectorsConfig.newBuilder()
                        .setParams(
                            VectorParams.newBuilder()
                                .setSize(1)
                                .setDistance(Distance.Cosine)
                                .build())
                        .build())
                .build()).get();
    }
}
```
