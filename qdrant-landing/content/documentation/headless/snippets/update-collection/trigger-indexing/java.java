package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

public class Snippet {
        public static void run() throws Exception {
                client.updateCollectionAsync(
                    UpdateCollection.newBuilder()
                        .setCollectionName("{collection_name}")
                        .setOptimizersConfig(
                            OptimizersConfigDiff.getDefaultInstance())
                        .build());
        }
}
