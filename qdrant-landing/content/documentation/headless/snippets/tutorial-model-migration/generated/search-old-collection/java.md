```java
QueryPoints oldRequest =
    QueryPoints.newBuilder()
        .setCollectionName(OLD_COLLECTION)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("my query")
                    .setModel(OLD_MODEL)
                    .build()))
        .setLimit(10)
        .build();

var results = client.queryAsync(oldRequest).get();
```
