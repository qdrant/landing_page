```java
String query = "time travel";

var results = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText(query)
                    .setModel(denseEmbeddingModel)
                    .build()))
        .setUsing("dense")
        .setLimit(10)
        .build()
).get();

for (var result : results) {
    System.out.println(result);
}
```
