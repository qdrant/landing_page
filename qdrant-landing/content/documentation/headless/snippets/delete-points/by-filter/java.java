package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Common.Filter;

public class Snippet {
        public static void run() throws Exception {
                client
                    .deleteAsync(
                        "{collection_name}",
                        Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
                    .get();
        }
}
