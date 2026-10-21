```java
results = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(
            Query.newBuilder()
                .setText(TextQuery.newBuilder().setQuery(query).build())
                .build())
        .setUsing("description")
        .setLimit(10)
        .build()
).get();

for (var result : results) {
    System.out.println(result);
}
```
