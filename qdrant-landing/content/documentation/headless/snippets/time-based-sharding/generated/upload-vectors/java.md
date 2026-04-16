```java
String csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

// Retrieve a list of existing shard keys in the collection
var shardKeyDescriptions = client.listShardKeysAsync(collectionName).get();
Set<String> existingShardKeys = new HashSet<>();
for (var desc : shardKeyDescriptions) {
    existingShardKeys.add(desc.getKey().getKeyword());
}

String denseModel = "sentence-transformers/all-MiniLM-L6-v2";
int batchSize = 100;
String currentDate = null;
List<PointStruct> buffer = new ArrayList<>();

try (var stream = parseCSV(csvUrl)) {
    for (var row : (Iterable<CsvRow>) stream::iterator) {
        String text = row.text;
        String datetime = row.datetime;
        String shardDate = datetime.substring(0, 10); // Extract YYYY-MM-DD

        if (!shardDate.equals(currentDate)) {
            // Flush buffer for the previous date before switching
            if (!buffer.isEmpty()) {
                client.upsertAsync(
                    UpsertPoints.newBuilder()
                        .setCollectionName(collectionName)
                        .addAllPoints(buffer)
                        .setShardKeySelector(shardKeySelector(currentDate))
                        .build()
                ).get();
                buffer.clear();
            }

            // Create shard for the new date if it doesn't exist yet
            if (!existingShardKeys.contains(shardDate)) {
                client.createShardKeyAsync(
                    CreateShardKeyRequest.newBuilder()
                        .setCollectionName(collectionName)
                        .setRequest(CreateShardKey.newBuilder()
                            .setShardKey(shardKey(shardDate))
                            .build())
                        .build()
                ).get();
                existingShardKeys.add(shardDate);
            }

            currentDate = shardDate;
        }

        // Add point to buffer
        buffer.add(
            PointStruct.newBuilder()
                .setId(id(UUID.randomUUID()))
                .setVectors(namedVectors(Map.of(
                    "dense_vector",
                    vector(Document.newBuilder()
                        .setText(text)
                        .setModel(denseModel)
                        .build()))))
                .putAllPayload(Map.of("text", value(text), "datetime", value(datetime)))
                .build());

        // Flush batch if buffer size exceeds batch size
        if (buffer.size() >= batchSize) {
            client.upsertAsync(
                UpsertPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .addAllPoints(buffer)
                    .setShardKeySelector(shardKeySelector(currentDate))
                    .build()
            ).get();
            buffer.clear();
        }
    }
}

// Flush remaining partial batch
if (!buffer.isEmpty()) {
    client.upsertAsync(
        UpsertPoints.newBuilder()
            .setCollectionName(collectionName)
            .addAllPoints(buffer)
            .setShardKeySelector(shardKeySelector(currentDate))
            .build()
    ).get();
}
```
