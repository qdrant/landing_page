```java
String queryText = "coffee";

var result = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .setShardKeySelector(shardKeySelector("2026-04-07"))
        .build()
).get();

for (var hit : result) {
    System.out.println(hit);
}
```
