```java
result = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .setShardKeySelector(ShardKeySelector.newBuilder()
            .addShardKeys(shardKey("2026-04-06"))
            .addShardKeys(shardKey("2026-04-07"))
            .build())
        .build()
).get();

for (var hit : result) {
    System.out.println(hit);
}
```
