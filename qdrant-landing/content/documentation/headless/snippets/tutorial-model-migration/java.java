package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.vectors;
import io.qdrant.client.WithPayloadSelectorFactory;
import io.qdrant.client.WithVectorsSelectorFactory;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.JsonWithInt.Value;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.UpsertPoints;
import io.qdrant.client.grpc.Points.ScrollPoints;
import io.qdrant.client.grpc.Points.UpdateMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Snippet {

    public static void run() throws Exception {
        // @hide-start
        String QDRANT_URL = "";
        String QDRANT_API_KEY = "";

        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
                    .withApiKey(QDRANT_API_KEY)
                    .build());

        String NEW_COLLECTION = "new_collection";
        String OLD_COLLECTION = "old_collection";

        String OLD_MODEL = "sentence-transformers/all-minilm-l6-v2";
        String NEW_MODEL = "qdrant/clip-vit-b-32-text";
        // @hide-end

        // @block-start create-new-collection
        client.createCollectionAsync(NEW_COLLECTION,
                VectorParams.newBuilder()
                    .setSize(512) // Size of the new embedding vectors
                    .setDistance(Distance.Cosine) // Similarity function for the new model
                    .build()).get();
        // @block-end create-new-collection

        // @block-start upsert-old-collection
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
        // @block-end upsert-old-collection

        // @block-start upsert-new-collection
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
        // @block-end upsert-new-collection

        // @block-start migrate-points
        int batchSize = 100; // Number of points to read in each batch
        boolean reachedEnd = false;

        // Get the next batch of points from the old collection
        var scrollBuilder = ScrollPoints.newBuilder()
            .setCollectionName(OLD_COLLECTION)
            .setLimit(batchSize)
            // Include payloads in the response, as we need them to re-embed the vectors
            .setWithPayload(WithPayloadSelectorFactory.enable(true))
            // We don't need the old vectors, so let's save on the bandwidth
            .setWithVectors(WithVectorsSelectorFactory.enable(false));

        while (!reachedEnd) {
            var scrollResult = client.scrollAsync(scrollBuilder.build()).get();

            var records = scrollResult.getResultList();

            // Re-embed the points using the new model
            List<PointStruct> points = new ArrayList<>();
            for (var record : records) {
                String text = record.getPayloadMap().containsKey("text")
                    ? record.getPayloadMap().get("text").getStringValue()
                    : "";

                points.add(
                    PointStruct.newBuilder()
                        // Keep the original ID to ensure consistency
                        .setId(record.getId())
                        // Use the new embedding model to encode the text from the payload,
                        // assuming that was the original source of the embedding
                        .setVectors(
                            vectors(
                                vector(
                                    Document.newBuilder()
                                        .setText(text)
                                        .setModel(NEW_MODEL)
                                        .build())))
                        // Keep the original payload
                        .putAllPayload(record.getPayloadMap())
                        .build());
            }

            // Upsert the re-embedded points into the new collection
            client.upsertAsync(
                UpsertPoints.newBuilder()
                    .setCollectionName(NEW_COLLECTION)
                    .addAllPoints(points)
                    // Only insert the point if a point with this ID does not already exist.
                    .setUpdateMode(UpdateMode.InsertOnly)
                    .build()).get();

            // Check if we reached the end of the collection
            if (scrollResult.hasNextPageOffset()) {
                scrollBuilder.setOffset(scrollResult.getNextPageOffset());
            } else {
                reachedEnd = true;
            }
        }
        // @block-end migrate-points

        // @block-start search-old-collection
        QueryPoints oldRequest =
            QueryPoints.newBuilder()
                .setCollectionName(OLD_COLLECTION)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("my query")
                            .setModel(OLD_MODEL)
                            .build()))
                .setLimit(10)
                .build();

        var results = client.queryAsync(oldRequest).get();
        // @block-end search-old-collection

        // @block-start search-new-collection
        QueryPoints newRequest =
            QueryPoints.newBuilder()
                .setCollectionName(NEW_COLLECTION)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("my query")
                            .setModel(NEW_MODEL)
                            .build()))
                .setLimit(10)
                .build();

        results = client.queryAsync(newRequest).get();
        // @block-end search-new-collection
    }

}
