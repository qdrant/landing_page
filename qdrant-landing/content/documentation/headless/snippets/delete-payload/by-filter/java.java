package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Common.Filter;
import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .deletePayloadAsync(
                        "{collection_name}",
                        List.of("color", "price"),
                        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
                        true,
                        null,
                        null)
                    .get();
        }
}
