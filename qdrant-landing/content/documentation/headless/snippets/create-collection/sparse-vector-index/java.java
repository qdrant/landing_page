package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                QdrantClient client = new QdrantClient(
                    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client.createCollectionAsync(
                    Collections.CreateCollection.newBuilder()
                        .setCollectionName("{collection_name}")
                        .setSparseVectorsConfig(
                            Collections.SparseVectorConfig.newBuilder().putMap(
                                "text",
                                Collections.SparseVectorParams.newBuilder()
                                    .setIndex(
                                        Collections.SparseIndexConfig
                                            .newBuilder()
                                            .build()
                                    ).build()
                            ).build()
                        ).build()
                ).get();
        }
}