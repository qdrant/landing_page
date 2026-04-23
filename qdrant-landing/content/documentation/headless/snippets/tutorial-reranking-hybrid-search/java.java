package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.Modifier;
import io.qdrant.client.grpc.Collections.MultiVectorComparator;
import io.qdrant.client.grpc.Collections.MultiVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.Query;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

public class Snippet {

    // @block-start parse-csv
    static class CsvRow {
        final String title;
        final String author;
        final String description;
        CsvRow(String title, String author, String description) {
            this.title = title; this.author = author; this.description = description;
        }
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
        List<String> headers = parseCsvLine.apply(headerLine);
        int titleIdx = headers.indexOf("Title");
        int authorIdx = headers.indexOf("Author");
        int descriptionIdx = headers.indexOf("Description");

        return reader.lines()
            .map(line -> {
                List<String> fields = parseCsvLine.apply(line);
                return new CsvRow(fields.get(titleIdx), fields.get(authorIdx), fields.get(descriptionIdx));
            })
            .onClose(() -> { try { reader.close(); } catch (Exception ignored) {} });
    }
    // @block-end parse-csv

    public static void run() throws Exception {
        // @hide-start
        String QDRANT_URL = "xyz-example.eu-central.aws.cloud.qdrant.io";
        String QDRANT_API_KEY = "<your-api-key>";
        // @hide-end
        // @block-start client-connection
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
                    .withApiKey(QDRANT_API_KEY)
                    .build());
        // @block-end client-connection

        // @block-start define-models
        String denseEmbeddingModel = "sentence-transformers/all-MiniLM-L6-v2";
        String sparseEmbeddingModel = "qdrant/bm25";
        String lateInteractionEmbeddingModel = "answerdotai/answerai-colbert-small-v1";
        // @block-end define-models

        // @block-start create-collection
        String collectionName = "hybrid-search";

        if (client.collectionExistsAsync(collectionName).get()) {
            client.deleteCollectionAsync(collectionName).get();
        }

        client.createCollectionAsync(
            CreateCollection.newBuilder()
                .setCollectionName(collectionName)
                .setVectorsConfig(
                    VectorsConfig.newBuilder()
                        .setParamsMap(
                            VectorParamsMap.newBuilder()
                                .putMap(
                                    "dense",
                                    VectorParams.newBuilder()
                                        .setSize(384)
                                        .setDistance(Distance.Cosine)
                                        .build())
                                .putMap(
                                    "multi",
                                    VectorParams.newBuilder()
                                        .setSize(96)
                                        .setDistance(Distance.Cosine)
                                        .setMultivectorConfig(
                                            MultiVectorConfig.newBuilder()
                                                .setComparator(MultiVectorComparator.MaxSim)
                                                .build())
                                        .setHnswConfig(
                                            HnswConfigDiff.newBuilder()
                                                .setM(0) // Disable HNSW for reranking
                                                .build())
                                        .build())
                                .build()))
                .setSparseVectorsConfig(
                    SparseVectorConfig.newBuilder()
                        .putMap(
                            "sparse",
                            SparseVectorParams.newBuilder()
                                .setModifier(Modifier.Idf)
                                .build())
                        .build())
                .build()
        ).get();
        // @block-end create-collection

        // @block-start ingest-data
        String csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

        int batchSize = 25;
        long idx = 0;
        List<PointStruct> buffer = new ArrayList<>();

        try (var stream = parseCSV(csvUrl)) {
            for (var row : (Iterable<CsvRow>) stream::iterator) {
                String title = row.title;
                String author = row.author;
                String description = row.description;

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
        // @block-end ingest-data

        // @block-start dense-retrieval
        String query = "time travel";

        var results = client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText(query)
                            .setModel(denseEmbeddingModel)
                            .build()))
                .setUsing("dense")
                .setLimit(10)
                .build()
        ).get();

        for (var result : results) {
            System.out.println(result);
        }
        // @block-end dense-retrieval

        // @block-start sparse-retrieval
        results = client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText(query)
                            .setModel(sparseEmbeddingModel)
                            .build()))
                .setUsing("sparse")
                .setLimit(10)
                .build()
        ).get();

        for (var result : results) {
            System.out.println(result);
        }
        // @block-end sparse-retrieval

        // @block-start hybrid-search
        results = client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .addPrefetch(
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(
                                Document.newBuilder()
                                    .setText(query)
                                    .setModel(denseEmbeddingModel)
                                    .build()))
                        .setUsing("dense")
                        .setLimit(20)
                        .build())
                .addPrefetch(
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(
                                Document.newBuilder()
                                    .setText(query)
                                    .setModel(sparseEmbeddingModel)
                                    .build()))
                        .setUsing("sparse")
                        .setLimit(20)
                        .build())
                .setQuery(Query.newBuilder().setFusion(Fusion.RRF).build())
                .setWithPayload(enable(true))
                .setLimit(10)
                .build()
        ).get();

        for (var result : results) {
            System.out.println(result);
        }
        // @block-end hybrid-search

        // @block-start rerank
        results = client.queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName(collectionName)
                .addPrefetch(
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(
                                Document.newBuilder()
                                    .setText(query)
                                    .setModel(denseEmbeddingModel)
                                    .build()))
                        .setUsing("dense")
                        .setLimit(20)
                        .build())
                .addPrefetch(
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(
                                Document.newBuilder()
                                    .setText(query)
                                    .setModel(sparseEmbeddingModel)
                                    .build()))
                        .setUsing("sparse")
                        .setLimit(20)
                        .build())
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText(query)
                            .setModel(lateInteractionEmbeddingModel)
                            .build()))
                .setUsing("multi")
                .setWithPayload(enable(true))
                .setLimit(10)
                .build()
        ).get();

        for (var result : results) {
            System.out.println(result);
        }
        // @block-end rerank
    }
}
