package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .updateCollectionAsync(
                        UpdateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setOptimizersConfig(
                                OptimizersConfigDiff.newBuilder().setIndexingThreshold(10000).build())
                            .build())
                    .get();
        }
}
