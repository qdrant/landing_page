```java
results = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText(query)
                    .setModel(sparseEmbeddingModel)
                    .build()))
        .setUsing("sparse")
        .setLimit(10)
        .build()
).get();

for (var result : results) {
    System.out.println(result);
}
```
