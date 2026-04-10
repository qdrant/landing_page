```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ShardKeyFactory.shardKey;
import static io.qdrant.client.ShardKeySelectorFactory.shardKeySelector;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.CreateShardKey;
import io.qdrant.client.grpc.Collections.CreateShardKeyRequest;
import io.qdrant.client.grpc.Collections.DeleteShardKey;
import io.qdrant.client.grpc.Collections.DeleteShardKeyRequest;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.ShardingMethod;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ShardKeySelector;
import io.qdrant.client.grpc.Points.UpsertPoints;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
            .withApiKey(QDRANT_API_KEY)
            .build());

String collectionName = "my_collection";

if (client.collectionExistsAsync(collectionName).get()) {
    client.deleteCollectionAsync(collectionName).get();
}

client.createCollectionAsync(
    CreateCollection.newBuilder()
        .setCollectionName(collectionName)
        .setVectorsConfig(VectorsConfig.newBuilder().setParamsMap(
            VectorParamsMap.newBuilder().putAllMap(Map.of(
                "dense_vector",
                VectorParams.newBuilder()
                    .setSize(384)
                    .setDistance(Distance.Cosine)
                    .build()))))
        .setShardingMethod(ShardingMethod.Custom)
        .build()
).get();

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

String queryText = "coffee";

var result = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .setShardKeySelector(shardKeySelector("2026-04-07"))
        .build()
).get();

for (var hit : result) {
    System.out.println(hit);
}

result = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .setShardKeySelector(ShardKeySelector.newBuilder()
            .addShardKeys(shardKey("2026-04-06"))
            .addShardKeys(shardKey("2026-04-07"))
            .build())
        .build()
).get();

for (var hit : result) {
    System.out.println(hit);
}

result = client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName(collectionName)
        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .build()
).get();

for (var hit : result) {
    System.out.println(hit);
}

String today = "2026-04-08";
String oldestShardKey = LocalDate.parse(today).minusDays(7).toString();

client.createShardKeyAsync(
    CreateShardKeyRequest.newBuilder()
        .setCollectionName(collectionName)
        .setRequest(CreateShardKey.newBuilder()
            .setShardKey(shardKey(today))
            .build())
        .build()
).get();

client.deleteShardKeyAsync(
    DeleteShardKeyRequest.newBuilder()
        .setCollectionName(collectionName)
        .setRequest(DeleteShardKey.newBuilder()
            .setShardKey(shardKey(oldestShardKey))
            .build())
        .build()
).get();

client.upsertAsync(
    UpsertPoints.newBuilder()
        .setCollectionName(collectionName)
        .addAllPoints(List.of(
            PointStruct.newBuilder()
                .setId(id(UUID.randomUUID()))
                .setVectors(namedVectors(Map.of(
                    "dense_vector",
                    vector(Document.newBuilder()
                        .setText("The best way to start a Wednesday is with a cup of coffee")
                        .setModel(denseModel)
                        .build()))))
                .putAllPayload(Map.of(
                    "text", value("The best way to start a Wednesday is with a cup of coffee"),
                    "datetime", value("2026-04-08T07:57:47")))
                .build()))
        .setShardKeySelector(shardKeySelector(today))
        .build()
).get();
```
