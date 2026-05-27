```java
client.upsertAsync(COLLECTION, List.of(
    PointStruct.newBuilder()
        .setId(id(1))
        .setVectors(
            namedVectors(
                Map.of(
                    OLD_VECTOR, vector(
                        Document.newBuilder()
                            .setText("Example document")
                            .setModel(OLD_MODEL)
                            .build()),
                    NEW_VECTOR, vector(
                        Document.newBuilder()
                            .setText("Example document")
                            .setModel(NEW_MODEL)
                            .build()))))
        .putAllPayload(Map.of("text", value("Example document")))
        .build())).get();
```
