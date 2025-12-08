package com.example.snippets_amalgamation;

import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;
import java.util.Map;

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
                            .putAllMetadata(
                                Map.of(
                                    "my-metadata-field",
                                    value(
                                        Map.of(
                                            "key-a", value("value-a"),
                                            "key-b", value(42)))))
                            .build())
                    .get();
        }
}
