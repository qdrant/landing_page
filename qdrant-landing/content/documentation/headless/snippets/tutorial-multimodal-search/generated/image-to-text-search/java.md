```java
results = ctx.call(() -> client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(
            nearest(
                Image.newBuilder()
                    .setImage(value(imageToBase64Url("images/image-2.png")))
                    .setModel("cohere/embed-v4.0")
                    .putOptions("output_dimension", value(512))
                    .build()))
        .setUsing("text")
        .setWithPayload(enable(true))
        .setLimit(1)
        .build()
).get());

System.out.println(results.get(0).getPayloadMap().get("caption"));
```
