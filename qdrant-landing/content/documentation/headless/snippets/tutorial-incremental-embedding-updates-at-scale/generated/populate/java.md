```java
static List<PointStruct> asPoints(List<Chunk> chunks) throws Exception {
    List<PointStruct> points = new ArrayList<>();
    for (Chunk c : chunks) {
        points.add(
            PointStruct.newBuilder()
                .setId(id(UUID.fromString(c.pointId)))
                // embedded by Qdrant Cloud Inference
                .setVectors(
                    vectors(
                        vector(
                            Document.newBuilder()
                                .setText(c.text)
                                .setModel(MODEL)
                                .build())))
                .putAllPayload(payload(c))
                .build());
    }
    return points;
}

static void populate() throws Exception {
    client.upsertAsync(MAIN, asPoints(prepare(CHUNKS))).get();
}
```
