package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import java.util.List;

public class Snippet {
        public static void run() throws Exception {
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
