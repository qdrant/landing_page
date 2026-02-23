```java
String EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2";

List<PointStruct> points = new ArrayList<>();

for (int idx = 0; idx < payloads.size(); idx++) {
    Map<String, Value> payload = payloads.get(idx);
    String description = payload.get("description").getStringValue();

    PointStruct point =
        PointStruct.newBuilder()
            .setId(id((long) idx))
            .setVectors(
                vectors(
                    vector(
                        Document.newBuilder()
                            .setText(description)
                            .setModel(EMBEDDING_MODEL)
                            .build())))
            .putAllPayload(payload)
            .build();

    points.add(point);
}

client.upsertAsync(COLLECTION_NAME, points).get();
```
