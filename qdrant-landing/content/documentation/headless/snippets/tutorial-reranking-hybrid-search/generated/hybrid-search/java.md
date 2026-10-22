```java
results = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .addPrefetch(
            PrefetchQuery.newBuilder()
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText(query)
                            .setModel(denseEmbeddingModel)
                            .build()))
                .setUsing("dense")
                .setLimit(20)
                .build())
        .addPrefetch(
            PrefetchQuery.newBuilder()
                .setQuery(
                    Query.newBuilder()
                        .setText(TextQuery.newBuilder().setQuery(query).build())
                        .build())
                .setUsing("description")
                .setLimit(20)
                .build())
        .setQuery(Query.newBuilder().setFusion(Fusion.RRF).build())
        .setWithPayload(enable(true))
        .setLimit(10)
        .build()
).get();

for (var result : results) {
    System.out.println(result);
}
```
