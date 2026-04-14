```java
String csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

int batchSize = 25;
long idx = 0;
List<PointStruct> buffer = new ArrayList<>();

try (var reader = new BufferedReader(new InputStreamReader(new URL(csvUrl).openStream()))) {
    reader.readLine(); // skip header row

    String line;
    while ((line = reader.readLine()) != null) {
        String[] fields = line.split(",", -1);
        String title = fields[0];
        String author = fields[1];
        String description = fields[3];

        buffer.add(
            PointStruct.newBuilder()
                .setId(io.qdrant.client.PointIdFactory.id(idx++))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "dense",
                            vector(
                                Document.newBuilder()
                                    .setText(description)
                                    .setModel(denseEmbeddingModel)
                                    .build()),
                            "sparse",
                            vector(
                                Document.newBuilder()
                                    .setText(description)
                                    .setModel(sparseEmbeddingModel)
                                    .build()),
                            "multi",
                            vector(
                                Document.newBuilder()
                                    .setText(description)
                                    .setModel(lateInteractionEmbeddingModel)
                                    .build()))))
                .putAllPayload(
                    Map.of(
                        "title", value(title),
                        "author", value(author),
                        "description", value(description)))
                .build());

        if (buffer.size() >= batchSize) {
            client.upsertAsync(collectionName, buffer).get();
            buffer.clear();
        }
    }
}

if (!buffer.isEmpty()) {
    client.upsertAsync(collectionName, buffer).get();
}
```
