package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchExceptKeywords;

public class Snippet {
        public static void run() throws Exception {
                matchExceptKeywords("color", List.of("black", "yellow"));
        }
}
