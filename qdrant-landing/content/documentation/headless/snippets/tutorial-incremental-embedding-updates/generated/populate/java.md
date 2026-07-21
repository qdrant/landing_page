```java
static void populate() throws Exception {
    List<PointStruct> points = new ArrayList<>();
    for (Chunk c : prepareChunksForSync(CHUNKS)) {
        points.add(
            PointStruct.newBuilder()
                .setId(id(UUID.fromString(c.pointId)))

                .setVectors(
                    vectors(
                        vector(
                            Document.newBuilder()
                                .setText(c.text)
                                .setModel(MODEL)
                                .build())))
                .putAllPayload(payload(c, null))
                .build());
    }
    client.upsertAsync(COLLECTION, points).get();
}
```
