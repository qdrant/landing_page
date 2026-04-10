```java
String csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

var shardKeyDescriptions = client.listShardKeysAsync(collectionName).get();
Set<String> existingShardKeys = new HashSet<>();
for (var desc : shardKeyDescriptions) {
    existingShardKeys.add(desc.getKey().getKeyword());
}

String denseModel = "sentence-transformers/all-MiniLM-L6-v2";
int batchSize = 100;
String currentDate = null;
List<PointStruct> buffer = new ArrayList<>();

Function<String, List<String>> parseCsvLine = line -> {
    List<String> fields = new ArrayList<>();
    int i = 0;
    while (i < line.length()) {
        if (line.charAt(i) == '"') {
            i++;
            StringBuilder sb = new StringBuilder();
            while (i < line.length()) {
                if (line.charAt(i) == '"' && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i += 2;
                } else if (line.charAt(i) == '"') {
                    i++;
                    break;
                } else {
                    sb.append(line.charAt(i++));
                }
            }
            fields.add(sb.toString());
            if (i < line.length() && line.charAt(i) == ',') i++;
        } else {
            int start = i;
            while (i < line.length() && line.charAt(i) != ',') i++;
            fields.add(line.substring(start, i));
            if (i < line.length()) i++;
        }
    }
    return fields;
};

try (var reader = new BufferedReader(new InputStreamReader(new URL(csvUrl).openStream()))) {
    String headerLine = reader.readLine();
    List<String> headers = List.of(headerLine.split(","));
    int textIdx = headers.indexOf("text");
    int datetimeIdx = headers.indexOf("datetime");

    String line;
    while ((line = reader.readLine()) != null) {
        List<String> fields = parseCsvLine.apply(line);
        String text = fields.get(textIdx);
        String datetime = fields.get(datetimeIdx);
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
