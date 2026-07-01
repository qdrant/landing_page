package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client =
                    new QdrantClient(
                        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
                            .withApiKey("<your-api-key")
                            .build());
                // @hide-end

                Context ctx = RequestHeaders.withHeader(
                    Context.current(), "openai-api-key", "<YOUR_OPENAI_API_KEY>");

                ctx.call(() -> client
                    .queryAsync(
                        Points.QueryPoints.newBuilder()
                            .setCollectionName("{collection_name}")
                            .addPrefetch(
                                PrefetchQuery.newBuilder()
                                    .setQuery(
                                        nearest(
                                            Document.newBuilder()
                                                .setModel("openai/text-embedding-3-small")
                                                .setText("How to bake cookies?")
                                                .putAllOptions(Map.of("mrl", value(64)))
                                                .build()))
                                    .setUsing("small")
                                    .setLimit(1000)
                                    .build())
                            .setQuery(
                                nearest(
                                    Document.newBuilder()
                                        .setModel("openai/text-embedding-3-small")
                                        .setText("How to bake cookies?")
                                        .build()))
                            .setUsing("large")
                            .build())
                    .get());
        }
}
