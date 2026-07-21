```java
// Reuse an existing embedding when the same text is already stored; embed only what is new.
static int[] reuseOrAdd(List<Chunk> unknownIds) throws Exception {
    int reused = 0;
    int added = 0;

    for (Chunk c : unknownIds) {
        Filter sameText = Filter.newBuilder()
            .addMust(matchKeyword("content_hash", c.contentHash))
            .build();

        var hits = client.scrollAsync(
            ScrollPoints.newBuilder()
                .setCollectionName(COLLECTION)
                .setFilter(sameText)
                .setLimit(1)
                .setWithPayload(WithPayloadSelectorFactory.include(List.of("last_updated")))
                .setWithVectors(WithVectorsSelectorFactory.enable(true))
                .build()).get().getResultList();

        PointStruct point;
        if (!hits.isEmpty()) { // same text, new address: copy the vector, keep its last_updated
            point = PointStruct.newBuilder()
                .setId(id(UUID.fromString(c.pointId)))
                .setVectors(vectors(vector(
                    VectorOutputHelper.getDenseVector(hits.get(0).getVectors().getVector())
                        .getDataList())))
                .putAllPayload(
                    payload(c, hits.get(0).getPayloadMap().get("last_updated").getStringValue()))
                .build();
            reused++;
        } else { // genuinely new content: embed and insert
            point = PointStruct.newBuilder()
                .setId(id(UUID.fromString(c.pointId)))
                .setVectors(
                    vectors(
                        vector(
                            Document.newBuilder()
                                .setText(c.text)
                                .setModel(MODEL)
                                .build())))
                .putAllPayload(payload(c, null))
                .build();
            added++;
        }

        client.upsertAsync(COLLECTION, List.of(point)).get();
    }

    return new int[] {reused, added};
}
```
