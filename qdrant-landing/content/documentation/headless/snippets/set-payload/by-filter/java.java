package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.grpc.Common.Filter;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .setPayloadAsync(
                        "{collection_name}",
                        Map.of("property1", value("string"), "property2", value("string")),
                        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
                        true,
                        null,
                        null)
                    .get();
        }
}
