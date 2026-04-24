package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.StrictModeConfig;
import io.qdrant.client.grpc.Collections.StrictModeMultivector;
import io.qdrant.client.grpc.Collections.StrictModeMultivectorConfig;

public class Snippet {
        public static void run() throws Exception {
                QdrantClient client =
                    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

                client
                    .createCollectionAsync(
                        CreateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setStrictModeConfig(
                                StrictModeConfig.newBuilder()
                                    .setEnabled(true)
                                    .setMultivectorConfig(
                                        StrictModeMultivectorConfig.newBuilder()
                                            .putMultivectorConfig("{vector_name}", StrictModeMultivector.newBuilder().setMaxVectors(10).build())
                                            .build())
                                    .build())
                            .build())
                    .get();
        }
}
