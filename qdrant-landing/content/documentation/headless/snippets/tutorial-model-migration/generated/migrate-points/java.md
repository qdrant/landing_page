```java
int batchSize = 100; // Number of points to read in each batch
boolean reachedEnd = false;

// Get the next batch of points from the old collection
var scrollBuilder = ScrollPoints.newBuilder()
    .setCollectionName(OLD_COLLECTION)
    .setLimit(batchSize)
    // Include payloads in the response, as we need them to re-embed the vectors
    .setWithPayload(WithPayloadSelectorFactory.enable(true))
    // We don't need the old vectors, so let's save on the bandwidth
    .setWithVectors(WithVectorsSelectorFactory.enable(false));

while (!reachedEnd) {
    var scrollResult = client.scrollAsync(scrollBuilder.build()).get();

    var records = scrollResult.getResultList();

    // Re-embed the points using the new model
    List<PointStruct> points = new ArrayList<>();
    for (var record : records) {
        String text = record.getPayloadMap().containsKey("text")
            ? record.getPayloadMap().get("text").getStringValue()
            : "";

        points.add(
            PointStruct.newBuilder()
                // Keep the original ID to ensure consistency
                .setId(record.getId())
                // Use the new embedding model to encode the text from the payload,
                // assuming that was the original source of the embedding
                .setVectors(
                    vectors(
                        vector(
                            Document.newBuilder()
                                .setText(text)
                                .setModel(NEW_MODEL)
                                .build())))
                // Keep the original payload
                .putAllPayload(record.getPayloadMap())
                .build());
    }

    // Upsert the re-embedded points into the new collection
    client.upsertAsync(
        UpsertPoints.newBuilder()
            .setCollectionName(NEW_COLLECTION)
            .addAllPoints(points)
            // Only insert the point if a point with this ID does not already exist.
            .setUpdateMode(UpdateMode.InsertOnly)
            .build()).get();

    // Check if we reached the end of the collection
    if (scrollResult.hasNextPageOffset()) {
        scrollBuilder.setOffset(scrollResult.getNextPageOffset());
    } else {
        reachedEnd = true;
    }
}
```
