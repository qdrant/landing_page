```java
QueryPoints request =
    QueryPoints.newBuilder()
        .setCollectionName(COLLECTION_NAME)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("alien invasion")
                    .setModel(EMBEDDING_MODEL)
                    .build()))
        .setLimit(3)
        .build();

var hits = client.queryAsync(request).get();

for (var hit : hits) {
    System.out.println(hit.getPayloadMap() + " score: " + hit.getScore());
}
```
