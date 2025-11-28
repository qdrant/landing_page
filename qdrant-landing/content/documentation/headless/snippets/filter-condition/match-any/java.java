package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeywords;

public class Snippet {
        public static void run() throws Exception {
                matchKeywords("color", List.of("black", "yellow"));
        }
}
