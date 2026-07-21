```java
static final String QUERY =
    "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

static void search() throws Exception {
    client.queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName(COLLECTION)
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setText(QUERY)
                        .setModel(MODEL)
                        .build()))
            .setLimit(3)
            .setWithPayload(WithPayloadSelectorFactory.include(List.of("section_url", "text")))
            .build()).get();
}
```
