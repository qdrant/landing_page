```java
result = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .build()
).get();

for (var hit : result) {
    System.out.println(hit);
}
```
