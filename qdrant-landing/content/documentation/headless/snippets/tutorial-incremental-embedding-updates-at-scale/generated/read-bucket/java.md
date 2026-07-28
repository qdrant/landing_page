```java
// Return a map of point ID to content hash for every chunk stored in bucket b.
// Pages through the results so nothing is missed in a large bucket.
static Map<String, String> readBucket(int b) throws Exception {
    Map<String, String> stored = new HashMap<>();
    PointId offset = null;

    while (true) {
        ScrollPoints.Builder request = ScrollPoints.newBuilder()
            .setCollectionName(MAIN)
            .setFilter(Filter.newBuilder().addMust(match("sync_bucket", b)).build())
            .setWithPayload(WithPayloadSelectorFactory.include(List.of("content_hash")))
            .setWithVectors(WithVectorsSelectorFactory.enable(false))
            .setLimit(1000);
        if (offset != null) {
            request.setOffset(offset);
        }

        ScrollResponse response = client.scrollAsync(request.build()).get();
        for (var point : response.getResultList()) {
            stored.put(
                point.getId().getUuid(),
                point.getPayloadMap().get("content_hash").getStringValue());
        }

        if (!response.hasNextPageOffset()) {
            return stored;
        }
        offset = response.getNextPageOffset();
    }
}
```
