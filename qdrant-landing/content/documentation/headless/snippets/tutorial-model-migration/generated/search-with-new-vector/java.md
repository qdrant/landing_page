```java
var newVectorResults = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(COLLECTION)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("my query")
                    .setModel(NEW_MODEL)
                    .build()))
        .setUsing(NEW_VECTOR)
        .setLimit(10)
        .build()).get();
```
