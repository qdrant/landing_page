package com.example.snippets_amalgamation;

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
import java.util.stream.Stream;

public class Snippet {

    // @block-start parse-csv
    static class CsvRow {
        final String text;
        final String datetime;
        CsvRow(String text, String datetime) { this.text = text; this.datetime = datetime; }
    }

    static Stream<CsvRow> parseCSV(String url) throws Exception {
        Function<String, List<String>> parseCsvLine = line -> {
            List<String> fields = new ArrayList<>();
            boolean inQuotes = false;
            var sb = new StringBuilder();
            for (char c : line.toCharArray()) {
                if (c == '"') {
                    inQuotes = !inQuotes;
                } else if (c == ',' && !inQuotes) {
                    fields.add(sb.toString());
                    sb.setLength(0);
                } else {
                    sb.append(c);
                }
            }
            fields.add(sb.toString());
            return fields;
        };

        var reader = new BufferedReader(new InputStreamReader(new URL(url).openStream()));
        String headerLine = reader.readLine();
        List<String> headers = List.of(headerLine.split(","));
        int textIdx = headers.indexOf("text");
        int datetimeIdx = headers.indexOf("datetime");

        return reader.lines()
            .map(line -> {
                List<String> fields = parseCsvLine.apply(line);
                return new CsvRow(fields.get(textIdx), fields.get(datetimeIdx));
            })
            .onClose(() -> { try { reader.close(); } catch (Exception ignored) {} });
    }
    // @block-end parse-csv

    public static void run() throws Exception {
        // @hide-start
        String QDRANT_URL = "";
        String QDRANT_API_KEY = "";
        // @hide-end

        // @block-start initialize-client
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
                    .withApiKey(QDRANT_API_KEY)
                    .build());
        // @block-end initialize-client

        // @block-start create-collection
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
        // @block-end create-collection

        // @block-start upload-vectors
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
        // @block-end upload-vectors

        // @block-start search-single-shard
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
        // @block-end search-single-shard

        // @block-start search-multiple-shards
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
        // @block-end search-multiple-shards

        // @block-start search-all-shards
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
        // @block-end search-all-shards

        // @block-start pruning-shards
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
        // @block-end pruning-shards

        // @block-start ingest-new-data
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
        // @block-end ingest-new-data
    }
}
