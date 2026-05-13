```java
int reEmbedBatchSize = 100;
boolean reEmbedReachedEnd = false;

var reEmbedScrollBuilder = ScrollPoints.newBuilder()
    .setCollectionName(COLLECTION)
    .setLimit(reEmbedBatchSize)
    .setWithPayload(WithPayloadSelectorFactory.enable(true))
    .setWithVectors(WithVectorsSelectorFactory.enable(false));

while (!reEmbedReachedEnd) {
    var reEmbedScrollResult = client.scrollAsync(reEmbedScrollBuilder.build()).get();
    var reEmbedRecords = reEmbedScrollResult.getResultList();

    List<PointVectors> pointVectors = new ArrayList<>();
    for (var record : reEmbedRecords) {
        String text = record.getPayloadMap().containsKey("text")
            ? record.getPayloadMap().get("text").getStringValue()
            : "";

        // Update only the new vector on each point; the old vector and payload are untouched
        pointVectors.add(
            PointVectors.newBuilder()
                .setId(record.getId())
                .setVectors(
                    namedVectors(
                        Map.of(
                            NEW_VECTOR, vector(
                                Document.newBuilder()
                                    .setText(text)
                                    .setModel(NEW_MODEL)
                                    .build()))))
                .build());
    }

    client.updateVectorsAsync(COLLECTION, pointVectors).get();

    if (reEmbedScrollResult.hasNextPageOffset()) {
        reEmbedScrollBuilder.setOffset(reEmbedScrollResult.getNextPageOffset());
    } else {
        reEmbedReachedEnd = true;
    }
}
```
