package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ValueFactory.value;

import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
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
