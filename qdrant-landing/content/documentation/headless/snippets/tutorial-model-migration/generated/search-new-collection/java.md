```java
QueryPoints newRequest =
    QueryPoints.newBuilder()
        .setCollectionName(NEW_COLLECTION)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("my query")
                    .setModel(NEW_MODEL)
                    .build()))
        .setLimit(10)
        .build();

results = client.queryAsync(newRequest).get();
```
