```java
static void checkGate() throws Exception {
    // compare this pipeline's constants against what the collection records about itself
    Map<String, Value> meta =
        client.getCollectionInfoAsync(COLLECTION).get().getConfig().getMetadataMap();

    Value model = meta.get("embedding_model");
    Value pipeline = meta.get("pipeline_version");
    if (model == null || !MODEL.equals(model.getStringValue())
            || pipeline == null || !PIPELINE.equals(pipeline.getStringValue())) {
        throw new RuntimeException(
            "collection was built by " + meta + ": full re-embed into a fresh collection required");
    }
}
```
