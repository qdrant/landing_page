```java
client.upsertAsync(OLD_COLLECTION, List.of(
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(
                vectors(
                    vector(
                        Document.newBuilder()
                            .setText("Example document")
                            .setModel(OLD_MODEL)
                            .build())))
            .putAllPayload(Map.of("text", value("Example document")))
            .build())).get();
```
