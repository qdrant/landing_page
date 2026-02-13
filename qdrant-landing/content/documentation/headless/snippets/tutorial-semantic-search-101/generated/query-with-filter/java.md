```java
QueryPoints filteredRequest =
    QueryPoints.newBuilder()
        .setCollectionName(COLLECTION_NAME)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("alien invasion")
                    .setModel(EMBEDDING_MODEL)
                    .build()))
        .setFilter(
            Filter.newBuilder()
                .addMust(range("year", Range.newBuilder().setGte(2000.0).build()))
                .build())
        .setLimit(1)
        .build();

var filteredHits = client.queryAsync(filteredRequest).get();

for (var hit : filteredHits) {
    System.out.println(hit.getPayloadMap() + " score: " + hit.getScore());
}
```
