package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.QueryPoints;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(
                        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                            .withApiKey("<your-openrouter-key>")
                            .build());
                // @hide-end

                Context ctx = RequestHeaders.withHeader(
                    Context.current(), "openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>");

                ctx.call(() -> client
                    .queryAsync(
                        QueryPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setQuery(
                                nearest(
                                    Document.newBuilder()
                                        .setModel("openrouter/mistralai/mistral-embed-2312")
                                        .setText("How to bake cookies?")
                                        .build()))
                            .build())
                    .get());
        }
}
