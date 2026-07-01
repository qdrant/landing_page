package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.HnswConfigDiff;
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
                            .setHnswConfig(
                                HnswConfigDiff.newBuilder().setMaxIndexingThreads(4).build())
                            .build())
                    .get();
        }
}
