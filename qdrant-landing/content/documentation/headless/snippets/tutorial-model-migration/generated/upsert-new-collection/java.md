```java
client.upsertAsync(NEW_COLLECTION, List.of(
        PointStruct.newBuilder()
            .setId(id(1))
            // Use the new embedding model to encode the document
            .setVectors(
                vectors(
                    vector(
                        Document.newBuilder()
                            .setText("Example document")
                            .setModel(NEW_MODEL)
                            .build())))
            .putAllPayload(Map.of("text", value("Example document")))
            .build())).get();
```
