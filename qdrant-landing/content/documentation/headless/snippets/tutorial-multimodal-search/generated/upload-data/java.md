```java
String cohereApiKey = System.getenv("COHERE_API_KEY");
Context ctx = RequestHeaders.withHeader(
    Context.current(), "cohere-api-key", cohereApiKey);

List<PointStruct> points = new java.util.ArrayList<>();
for (int idx = 0; idx < documents.size(); idx++) {
    Doc doc = documents.get(idx);
    points.add(
        PointStruct.newBuilder()
            .setId(io.qdrant.client.PointIdFactory.id(idx))
            .setVectors(
                namedVectors(
                    Map.of(
                        "text",
                        vector(
                            Document.newBuilder()
                                .setText(doc.caption)
                                .setModel("cohere/embed-v4.0")
                                .putOptions("output_dimension", value(512))
                                .build()),
                        "image",
                        vector(
                            Image.newBuilder()
                                .setImage(value(imageToBase64Url(doc.image)))
                                .setModel("cohere/embed-v4.0")
                                .putOptions("output_dimension", value(512))
                                .build()))))
            .putAllPayload(
                Map.of(
                    "caption", value(doc.caption),
                    "image", value(doc.image)))
            .build());
}

ctx.call(() -> client.upsertAsync(collectionName, points).get());
```
