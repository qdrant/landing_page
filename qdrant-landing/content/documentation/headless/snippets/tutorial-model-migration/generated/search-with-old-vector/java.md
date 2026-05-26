```java
var oldVectorResults = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(COLLECTION)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("my query")
                    .setModel(OLD_MODEL)
                    .build()))
        .setUsing(OLD_VECTOR)
        .setLimit(10)
        .build()).get();
```
