package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.geoRadius;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.QueryPoints;

public class Snippet {

    public static void run() throws Exception {
        // @hide-start
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                    .withApiKey("<your-api-key>")
                    .build());
        // @hide-end

        var results =
            client
                .queryAsync(
                    QueryPoints.newBuilder()
                        .setCollectionName("venues")
                        .setQuery(
                            nearest(
                                Document.newBuilder()
                                    .setText("quiet café to work from")
                                    .setModel("sentence-transformers/all-minilm-l6-v2")
                                    .build()))
                        .setFilter(
                            Filter.newBuilder()
                                .addMust(geoRadius("location", 52.520711, 13.403683, 1500.0f))
                                .build())
                        .setLimit(5)
                        .build())
                .get();
    }
}
