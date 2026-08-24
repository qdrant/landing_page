```java
var results = ctx.call(() -> client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("Plane components")
                    .setModel("cohere/embed-v4.0")
                    .putOptions("output_dimension", value(512))
                    .build()))
        .setUsing("image")
        .setWithPayload(enable(true))
        .setLimit(1)
        .build()
).get());

System.out.println(results.get(0).getPayloadMap().get("image"));
```
