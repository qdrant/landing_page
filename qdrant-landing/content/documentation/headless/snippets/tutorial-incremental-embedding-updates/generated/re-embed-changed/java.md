```java
static void reEmbedChanged(List<Chunk> contentChanged) throws Exception {
    if (contentChanged.isEmpty()) {
        return;
    }
    List<PointStruct> points = new ArrayList<>();
    for (Chunk c : contentChanged) {
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
